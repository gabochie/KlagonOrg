-- ============================================================
-- Marketing consent: self-read, and a pairing check that actually exists.
--
-- Two things this fixes, both found in review.
--
-- 1) Withdrawal was unreachable (HIGH).
--
--    `marketing_consent()` is `security invoker` (20261007000000:83) and the
--    only SELECT policy on the ledger was admin-only (`to authenticated using
--    (is_klagon_admin())`). So a non-admin's lookup for their own address
--    returned no row -> NULL -> treated as false. `SettingsPanel` therefore
--    loaded every non-admin as unticked, and its "write only when the tick
--    moved" guard could only ever fire false -> true: you could grant, and
--    never withdraw.
--
--    That contradicted src/app/privacy/page.tsx, which promises permission can
--    be changed at any time from Settings -> Marketing. It also meant the
--    append-only design's intended revocation path (a later row with
--    granted = false) had no caller that could ever take it.
--
--    Fix: let a signed-in member read rows whose subject they can demonstrate
--    they own -- their own profile id, and the email/phone on their own
--    profile row. Nothing else becomes readable: the policy resolves against
--    `profiles`, which itself only exposes a row to its own owner or an admin
--    (profiles_select_own_or_admin), so the effective scope is "subjects that
--    are mine".
--
--    Useful side effect: a forged row (see the insert policy -- anyone may
--    record consent for any subject) becomes visible to its victim, who can
--    then untick and write a superseding `granted = false`. The forgery is
--    still possible, but it is no longer invisible to the person it names.
--
--    Deliberately NOT granted to anon: an anonymous caller has no identity to
--    own a subject with, and no settings page to show it on.
--
-- 2) The pairing check the ledger claimed to have.
--
--    20261007000000:51-54 asserted that `with check` stops a row claiming
--    subject_type = 'email' while holding a phone number. It does not: the
--    column checks (`:26-31`) only constrain each column's own domain. The
--    view matches on subject_type AND subject_value together, so a mismatched
--    row would simply never be marketable -- harmless in effect, but the
--    documented guarantee was fiction and the ledger could hold nonsense.
--
--    Now a real constraint. `profile` subjects are left unshaped on purpose:
--    they are ids minted elsewhere and validating the format here would only
--    create a second place that can reject a legitimate write.
--
--    No rows exist in production yet (verified at audit time: consents = 0),
--    so this cannot fail on existing data.
--
-- Apply: Supabase dashboard -> SQL Editor (or CLI runner).
-- ============================================================

-- ---------- 1) self-read ----------
drop policy if exists "marketing_consents_self_read" on public.marketing_consents;
create policy "marketing_consents_self_read" on public.marketing_consents
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and (
          (marketing_consents.subject_type = 'profile'
            and marketing_consents.subject_value = p.id::text)
          or (marketing_consents.subject_type = 'email'
            and marketing_consents.subject_value = lower(btrim(p.email)))
          or (marketing_consents.subject_type = 'phone'
            and marketing_consents.subject_value = lower(btrim(p.phone)))
        )
    )
  );

comment on policy "marketing_consents_self_read" on public.marketing_consents is
  'A member may read consent recorded for their own profile id, email or phone, so Settings can show the current choice and withdraw it. Subjects are resolved against profiles, which only an owner or admin can read.';

-- ---------- 2) real subject pairing ----------
alter table public.marketing_consents
  drop constraint if exists marketing_consents_subject_shape;

alter table public.marketing_consents
  add constraint marketing_consents_subject_shape
  check (
    (subject_type = 'email' and position('@' in subject_value) > 0)
    or (subject_type = 'phone' and position('@' in subject_value) = 0)
    or (subject_type = 'profile')
  );

comment on constraint marketing_consents_subject_shape on public.marketing_consents is
  'An email subject must look like an address and a phone subject must not, so subject_type and subject_value cannot disagree.';

-- ---------- reading it back ----------
-- Selecting your own consent now works as a signed-in member:
--   select channel, granted from marketing_consents
--    where subject_type = 'profile' and subject_value = auth.uid()::text;
-- Admins still read the whole ledger via marketing_consents_admin_read.
