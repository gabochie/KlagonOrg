-- ============================================================
-- Self-hosted client error log (replaces Sentry — no vendor).
--
-- * The site reports window errors / unhandled rejections here via
--   reportError() in src/lib/observability.ts (flood-capped per
--   session, never throws into the page).
-- * Anyone (anon + authenticated) may INSERT — errors happen
--   pre-login too. Reads/deletes are staff-only.
-- * Until this is applied, reportError() silently no-ops.
--
-- Apply: Supabase dashboard -> SQL Editor (or CLI runner).
-- ============================================================

create table if not exists public.client_errors (
  id uuid not null default gen_random_uuid() primary key,
  message text not null check (char_length(message) between 1 and 1000),
  stack text,
  url text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists client_errors_created_idx
  on public.client_errors (created_at desc);

alter table public.client_errors enable row level security;

-- errors happen pre-login too: anyone may file, trimmed sane
drop policy if exists "client_errors_insert_all" on public.client_errors;
create policy "client_errors_insert_all" on public.client_errors
  for insert to anon, authenticated
  with check (char_length(message) between 1 and 1000);

-- staff read + prune
drop policy if exists "client_errors_admin_all" on public.client_errors;
create policy "client_errors_admin_all" on public.client_errors
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- sanity check (empty until the first real crash)
select count(*) as client_errors from public.client_errors;