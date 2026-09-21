-- ============================================================
-- Shared QA sign-off record for the Super Admin Quality Center.
-- Manual checklist ticks are per-browser localStorage by default;
-- this table is the shared truth across staff and devices:
-- one row per check, upserted on toggle, wiped on release reset.
-- Super-admin only (uses is_klagon_super_admin()).
-- ============================================================

create table if not exists public.qa_signoffs (
  area_id text not null,
  check_index integer not null,
  checked boolean not null default true,
  checked_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (area_id, check_index)
);

alter table public.qa_signoffs enable row level security;

drop policy if exists "qa_signoffs_super_all" on public.qa_signoffs;
create policy "qa_signoffs_super_all" on public.qa_signoffs
  for all
  to authenticated
  using (public.is_klagon_super_admin())
  with check (public.is_klagon_super_admin());
