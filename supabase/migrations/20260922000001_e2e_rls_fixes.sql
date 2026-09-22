-- ============================================================
-- E2E-gated RLS fixes (caught by the Playwright suite, #4).
--
-- 1. Authors can SELECT their own posts (any status). Without this,
--    PostgREST denies INSERT..RETURNING on member submissions
--    (submitPost uses .insert().select("id")), so members cannot
--    submit from /submit at all — and My Posts can never show
--    pending items. Public read of approved posts is unchanged
--    (posts_select_public); this only adds own-row visibility.
-- 2. Restore EXECUTE on is_klagon_super_admin() to authenticated.
--    super_admin_split revoked it, but the restrictive
--    profiles_role_no_direct_change policy CALLS it on every
--    profiles UPDATE — so no member could update their own
--    profile. The function is security definer and only reports
--    the caller's own super-admin status, so granting execute
--    to authenticated is safe.
--
-- Apply: Supabase dashboard -> SQL Editor (or CLI runner).
-- ============================================================

grant execute on function public.is_klagon_super_admin() to authenticated;

drop policy if exists "posts_select_own" on public.posts;
create policy "posts_select_own" on public.posts
  for select to authenticated
  using (submitted_by = auth.uid());

-- sanity check (no rows harmed; policies visible)
select policyname, cmd, permissive, roles
from pg_policies
where schemaname = 'public' and tablename in ('posts', 'profiles')
order by tablename, policyname;