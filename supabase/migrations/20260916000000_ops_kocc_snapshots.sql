-- ============================================================
-- KlagonOrg Command Center — cloud sync
-- One snapshot row per admin owner (payload = full engine state).
-- Append-only audit of saves. RLS: owners + admins only.
-- ============================================================

create table public.ops_kocc_snapshots (
  owner uuid primary key references auth.users(id) on delete cascade,
  days int,                            -- day-of-90 at last save (derived)
  payload jsonb not null,              -- full Command Center state
  updated_at timestamptz not null default now()
);

create table public.ops_kocc_audit (
  id bigint generated always as identity primary key,
  owner uuid references auth.users(id) on delete cascade,
  event jsonb not null,
  created_at timestamptz not null default now()
);

create index ops_kocc_audit_owner_idx on public.ops_kocc_audit (owner, created_at desc);

alter table public.ops_kocc_snapshots enable row level security;
alter table public.ops_kocc_audit enable row level security;

-- helper: the requesting user must be an admin/super_admin
create or replace function public.is_klagon_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  );
$$;

create policy "admin manages own snapshot"
  on public.ops_kocc_snapshots
  for all
  to authenticated
  using (owner = auth.uid() and public.is_klagon_admin())
  with check (owner = auth.uid() and public.is_klagon_admin());

create policy "admin reads own audit"
  on public.ops_kocc_audit
  for select
  to authenticated
  using (owner = auth.uid() and public.is_klagon_admin());

create policy "admin writes own audit"
  on public.ops_kocc_audit
  for insert
  to authenticated
  with check (owner = auth.uid() and public.is_klagon_admin());

grant select, insert, update, delete on public.ops_kocc_snapshots to authenticated;
grant select, insert on public.ops_kocc_audit to authenticated;