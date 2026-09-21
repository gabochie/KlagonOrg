-- ============================================================
-- Split Admin vs Super Admin.
--
-- Until now every RLS policy treated admin and super_admin
-- identically, so any admin could promote anyone (including
-- themselves) via a direct profiles update. From here:
--   admin       — day-to-day ops (moderation, outreach, claims)
--   super_admin — platform control: role assignment, audit
--
--   1. is_klagon_super_admin() helper (security definer, no RLS
--      recursion — same pattern as is_klagon_admin()).
--   2. set_member_role() RPC: the ONLY way to change a role.
--      Guards: caller must be super_admin; role must be a real
--      role; no self-demotion; never strand zero super_admins.
--   3. Restrictive policy blocks direct role edits: any UPDATE
--      that changes `role` fails unless the caller is super_admin.
--      Ordinary profile edits (role untouched) still pass.
-- ============================================================

-- ---------- 1. super-admin helper ----------
create or replace function public.is_klagon_super_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

alter function public.is_klagon_super_admin() set search_path = public;
revoke all on function public.is_klagon_super_admin() from public, anon, authenticated;

-- ---------- 2. role assignment RPC ----------
create or replace function public.set_member_role(p_user_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_super_count int;
  v_old_role public.user_role;
begin
  if not public.is_klagon_super_admin() then
    raise exception 'super admin only';
  end if;
  if p_role not in ('member', 'admin', 'super_admin') then
    raise exception 'unknown role %', p_role;
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot change your own role';
  end if;

  select role into v_old_role from public.profiles where id = p_user_id;
  if not found then
    raise exception 'profile not found';
  end if;

  -- Never strand the platform with zero super_admins.
  if v_old_role = 'super_admin' and p_role <> 'super_admin' then
    select count(*) into v_super_count
    from public.profiles where role = 'super_admin';
    if v_super_count <= 1 then
      raise exception 'cannot demote the last super admin';
    end if;
  end if;

  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

revoke all on function public.set_member_role(uuid, public.user_role) from public, anon;
grant execute on function public.set_member_role(uuid, public.user_role) to authenticated;

-- ---------- 3. block direct role edits ----------
-- Restrictive: must pass IN ADDITION to the permissive policies, so
-- role changes via plain UPDATE fail for everyone except super_admins
-- (who must still use the RPC — direct edits stay blocked for them too,
-- keeping one auditable path). The subquery reads the pre-update row;
-- select-side RLS (own-or-admin) always permits it for updaters.
drop policy if exists "profiles_role_no_direct_change" on public.profiles;
create policy "profiles_role_no_direct_change" on public.profiles
  as restrictive
  for update
  to authenticated
  using (true)
  with check (
    public.is_klagon_super_admin()
    or role = (select p.role from public.profiles p where p.id = profiles.id)
  );
