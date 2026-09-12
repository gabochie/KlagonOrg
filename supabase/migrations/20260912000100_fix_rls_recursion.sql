-- ============================================================
-- KlagonStudios — fix RLS recursion in profile helper functions
-- The select policy on profiles calls is_admin(), which queries
-- profiles again -> infinite recursion. SECURITY DEFINER breaks it.
-- ============================================================

create or replace function public.current_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'member'::public.user_role);
$$;

create or replace function public.is_approved_member()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;