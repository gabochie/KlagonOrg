-- ============================================================
-- KlagonOrg — security lint remediation, part 2 (2026-09-17 export, 38 WARNs)
-- Supabase Performance Security Lints, project rvavixcgtninzccskfpy.
--
-- Completes 20260914180000_fix_security_lints.sql (which was never applied):
-- every statement here is idempotent, so apply via `supabase db push`
-- (timestamp ordering guarantees dependencies exist first).
--
-- Deliberately NOT changed (accepted risk, documented):
--   * log_agent_lead / confirm_donation_by_ref / get_donation_sendable keep
--     anon EXECUTE — the Moolre Cloudflare Worker calls them with the anon
--     key. confirm_donation_by_ref already whitelists statuses ('paid',
--     'failed') and only touches pending rows addressed by unguessable refs;
--     log_agent_lead requires phone-or-email and dedupes on email.
--   * award_lesson_xp / award_reader_xp keep NO client grant at all after §3
--     (both are trigger-only; the earlier draft's "used in src/" claim was
--     wrong — no src/ caller exists).
--   * "Leaked Password Protection Disabled" is a dashboard toggle, not SQL:
--     Dashboard > Authentication > Protection > leaked-password protection ON.
-- ============================================================

-- ------------------------------------------------------------------
-- §1 function_search_path_mutable (lint 0011)
-- Pin search_path on every flagged SECURITY DEFINER function.
-- ------------------------------------------------------------------
alter function public.get_donation_sendable(text) set search_path = public;
alter function public.touch_updated_at() set search_path = public;
alter function public.award_lesson_xp() set search_path = public;
alter function public.is_klagon_admin() set search_path = public;

-- ------------------------------------------------------------------
-- §2 rls_policy_always_true (lint 0024): lessons_admin_update
-- This policy exists on live but not in repo history — normalize it to
-- the same admin check as its sibling lessons_admin_all.
-- ------------------------------------------------------------------
drop policy if exists "lessons_admin_update" on public.lessons;
create policy "lessons_admin_update" on public.lessons
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ------------------------------------------------------------------
-- §3 EXECUTE revokes (lints 0028/0029)
-- Trigger-only functions and RLS-policy helpers: policies and triggers
-- invoke them as SECURITY DEFINER, never via the EXECUTE grant, so
-- revoking breaks nothing. Verified: no src/ caller for any of these.
-- ------------------------------------------------------------------
revoke execute on function public.award_lesson_xp() from anon, authenticated;
revoke execute on function public.award_reader_xp() from anon, authenticated;
revoke execute on function public.touch_updated_at() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.on_profile_approved() from anon, authenticated;
revoke execute on function public.is_admin() from anon, authenticated;
revoke execute on function public.is_super_admin() from anon, authenticated;
revoke execute on function public.is_approved_member() from anon, authenticated;
revoke execute on function public.current_role() from anon, authenticated;
revoke execute on function public.is_klagon_admin() from anon, authenticated;

-- Helper block: revoke anon EXECUTE only on functions that exist.
-- Live databases upgraded by hand can hold a mix of applied migrations
-- (e.g. the sponsor platform function may be absent), so every object
-- below is looked up with to_regprocedure (NULL when missing) and skipped.
do $$
declare
  f regprocedure;
  targets regprocedure[] := array[
    to_regprocedure('public.set_sponsor_updated_at()'),
    to_regprocedure('public.posts_before_upsert()'),
    to_regprocedure('public.posts_on_approve()'),
    to_regprocedure('public.posts_report_auto_hide()'),
    to_regprocedure('public.purchase_boost(uuid, public.boost_tier)')
  ];
begin
  foreach f in array targets loop
    if f is not null then
      execute 'revoke execute on function ' || f::text || ' from anon';
    end if;
  end loop;
end;
$$;

-- promote_sponsor_application: admin client calls it (SponsorAdminContent),
-- so authenticated stays — but anon never should. Internal is_admin()
-- guard already present in the body; this removes the public path.
-- Guarded: the sponsor platform migration may not have applied yet.
do $$
declare oid_ oid;
begin
  select p.oid into oid_ from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'promote_sponsor_application'
   limit 1;
  if oid_ is not null then
    execute 'revoke all on function ' || oid_::regprocedure || ' from public, anon';
    execute 'grant execute on function ' || oid_::regprocedure || ' to authenticated';
  end if;
end;
$$;

-- ------------------------------------------------------------------
-- §4 log_audit: close the audit-forgery hole
-- Any authenticated user could previously insert arbitrary audit rows.
-- Same signature (defaults preserved) + admin guard; anon revoked.
-- Sole client caller is the admin MembersTable.
-- ------------------------------------------------------------------
create or replace function public.log_audit(
  p_action text, p_entity text, p_entity_id text default null,
  p_detail jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  insert into public.audit_logs (actor_id, action, entity, entity_id, detail)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_detail);
end;
$$;

revoke all on function public.log_audit(text, text, text, jsonb) from public, anon;
grant execute on function public.log_audit(text, text, text, jsonb) to authenticated;
