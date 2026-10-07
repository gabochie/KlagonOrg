-- ============================================================
-- marketable_subscribers: the only safe source for a marketing send.
--
-- The gap this closes: the consent forms write to `marketing_consents`, but
-- `subscribers` has no consent column of its own. The obvious query
-- (select from public.subscribers) would therefore mail every address ever
-- collected, permission or not. Nothing sends today, so the risk is
-- theoretical -- until the day a sender is written, and it must not have to
-- remember a check that does not exist yet.
--
-- Shape: one row per (subscriber, channel) we may actually use. Absence of a
-- row IS the answer. A refusal (granted = false) and a person we never asked
-- both simply do not appear, which is the same default-deny reading enforced
-- by src/lib/consent.ts -- no row means no permission.
--
-- On top of the per-channel lookup:
--   * subscribed = false              -- left the list
--   * phone is null                   -- no SMS/WhatsApp subject to send to
--   * marketing_consent() is not true -- the channel's latest decision
--
-- Read path: security_invoker, so `subscribers` RLS (admin-only SELECT) still
-- applies -- anon and non-admin authenticated callers get zero rows through
-- the view as well. Do not drop it to "make the sender work": run the sender
-- as service_role, which bypasses RLS on the tables but still receives every
-- filter written here, because these are WHERE clauses, not policies.
--
-- Known cost of this default-deny: a subscriber collected before consent
-- recording existed has no ledger row, so they will not appear. They are
-- treated as never asked, which is the correct reading. Re-collect the tick
-- rather than grandfathering anyone in.
--
-- Apply: Supabase dashboard -> SQL Editor (or CLI runner).
-- ============================================================

create or replace view public.marketable_subscribers as
select
  s.id as subscriber_id,
  'email'::text as channel,
  lower(btrim(s.email)) as subject,
  s.source,
  s.created_at as subscribed_at
from public.subscribers s
where s.subscribed
  and public.marketing_consent('email', s.email, 'email') = true

union all

select
  s.id,
  'sms',
  lower(btrim(s.phone)),
  s.source,
  s.created_at
from public.subscribers s
where s.subscribed
  and s.phone is not null
  and public.marketing_consent('phone', s.phone, 'sms') = true

union all

select
  s.id,
  'whatsapp',
  lower(btrim(s.phone)),
  s.source,
  s.created_at
from public.subscribers s
where s.subscribed
  and s.phone is not null
  and public.marketing_consent('phone', s.phone, 'whatsapp') = true;

alter view public.marketable_subscribers set (security_invoker = true);

-- Supabase default privileges hand SELECT on new views to anon. The view is
-- already RLS-filtered underneath, but revoke it anyway so the only way in is
-- an authenticated session that subscribers_admin_all passes.
revoke select on public.marketable_subscribers from anon;
grant select on public.marketable_subscribers to authenticated;
grant select on public.marketable_subscribers to service_role;

comment on view public.marketable_subscribers is
  'Default-deny send list: one row per subscriber plus channel where marketing permission is on file. Reading public.subscribers to send anything is a bug.';

comment on table public.subscribers is
  'Newsletter list. Carries no consent column of its own. Use marketable_subscribers to send, never this table directly.';
