-- ============================================================
-- KlagonStudios — security lint remediation (DRAFT — review before run)
-- Addresses Supabase Security Advisor findings exported 2026-09-14.
-- Run from SQL Editor. Each block is independent; read each header first.
-- ============================================================

-- NOTES / JUDGMENT CALLS
--  * Several findings are WARN-as-designed (the linter allows them when
--    intentional). They are still hardened here because there is zero cost.
--  * Lint 0028/0029 (anon/authenticated can EXECUTE SECURITY DEFINER fn):
--    - RPCs the app CALLS from the client keep EXECUTE for their intended role
--      (award_lesson_xp, award_reader_xp, confirm_donation_by_ref,
--       get_donation_sendable) — verified as used in src/.
--    - Internal-only helpers (is_admin, is_super_admin, is_approved_member,
--      current_role, log_audit, handle_new_user, on_profile_approved) have
--      EXECUTE revoked from anon/authenticated. RLS-policy / trigger calls
--      keep working (they run under SECURITY DEFINER, not via EXECUTE grant).
--  * The auth leaked-password protection finding is NOT a database lint — it is
--    a project setting in Dashboard > Authentication. See end of file.

-- ============================================================
-- 1) SECURITY DEFINER views (lint 0010) -> SECURITY INVOKER
--    PG15+: best fixed in place; a view is INVOKER when its listed tables
--    have RLS that applies to the querying user, or by dropping/recreating
--    without SECURITY DEFINER. Verify the view definitions still resolve to
--    the intended (public-read) source before running.
-- ============================================================
alter view public.projects_public
  set (security_invoker = true);
alter view public.courses_public
  set (security_invoker = true);
alter view public.events_public
  set (security_invoker = true);

-- ============================================================
-- 2) Functions with mutable search_path (lint 0011)
--    SECURITY DEFINER without fixed search_path is a privilege-escalation risk.
--    Pinning search_path removes the lint with no behavior change for these
--    bodies (all reference tables/helpers via "public." qualification).
-- ============================================================
alter function public.touch_updated_at() set search_path = public;
alter function public.award_lesson_xp() set search_path = public;
alter function public.award_reader_xp() set search_path = public;
alter function public.confirm_donation_by_ref(p_ref text, p_status text) set search_path = public;
alter function public.get_donation_sendable(p_ref text) set search_path = public;
alter function public.current_role() set search_path = public;
alter function public.is_admin() set search_path = public;
alter function public.is_super_admin() set search_path = public;
alter function public.is_approved_member() set search_path = public;
alter function public.handle_new_user() set search_path = public;
alter function public.on_profile_approved() set search_path = public;
alter function public.log_audit(p_action text, p_entity text, p_entity_id text, p_detail jsonb) set search_path = public;

-- ============================================================
-- 3) RLS policies that are always true (lint 0024)
--    Public forms validated client-side, but the DB policy must not be the
--    "WITH CHECK always true" no-op the linter flags. Tighten to a real,
--    minimal constraint that still permits legitimate anonymous submissions.
--    NOTE: pick the field set that your app guarantees on submit
--    (required inputs). Swap in your actual required columns if different.
-- ============================================================
drop policy if exists "contact_messages_insert_anon" on public.contact_messages;
create policy "contact_messages_insert_anon" on public.contact_messages
  for insert to anon, authenticated
  with check (
    coalesce(trim(email), '') <> ''
    and coalesce(trim(full_name), '') <> ''
    and char_length(email) <= 320
  );

drop policy if exists "mentor_applications_insert_anon" on public.mentor_applications;
create policy "mentor_applications_insert_anon" on public.mentor_applications
  for insert to anon, authenticated
  with check (
    coalesce(trim(full_name), '') <> ''
    and coalesce(trim(email), '') <> ''
    and char_length(email) <= 320
  );

drop policy if exists "sponsor_applications_insert_anon" on public.sponsor_applications;
create policy "sponsor_applications_insert_anon" on public.sponsor_applications
  for insert to anon, authenticated
  with check (
    coalesce(trim(org_name), '') <> ''
    or coalesce(trim(full_name), '') <> ''
  );

drop policy if exists "volunteer_signups_insert_open" on public.volunteer_signups;
create policy "volunteer_signups_insert_open" on public.volunteer_signups
  for insert to anon, authenticated
  with check (
    coalesce(trim(full_name), '') <> ''
    and coalesce(trim(email), '') <> ''
  );

-- ============================================================
-- 4) Revoke EXECUTE from anon/authenticated on internal-only
--    SECURITY DEFINER helpers (lint 0028/0029).
--    These are called BY policies/triggers (hosted as SECURITY DEFINER), not
--    by clients, so removing the EXECUTE grant does not break them.
-- ============================================================
revoke execute on function public.is_admin() from anon, authenticated;
revoke execute on function public.is_super_admin() from anon, authenticated;
revoke execute on function public.is_approved_member() from anon, authenticated;
revoke execute on function public.current_role() from anon, authenticated;
revoke execute on function public.log_audit(p_action text, p_entity text, p_entity_id text, p_detail jsonb) from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.on_profile_approved() from anon, authenticated;

-- ============================================================
-- 5) NON-SQL: "Leaked Password Protection Disabled" (auth setting)
--    Supabase Dashboard > Authentication > Security/Protection
--    -> toggle ON "Prevent leaked password protection"
--    (Requires a recent Supabase Auth; not a database change.)
-- ============================================================
