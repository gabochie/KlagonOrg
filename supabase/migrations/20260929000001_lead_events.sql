-- Phase 1 (lead-gen): conversion telemetry.
-- Every form submit and key WhatsApp/call tap records one row via
-- recordLeadEvent (fire-and-forget, anon-safe). Powers funnels: which page
-- and source actually produce sponsors, donors, volunteers and members.

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles(id) on delete set null,
  source text not null,
  action text not null,
  page text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists lead_events_source_action_idx
  on public.lead_events (source, action, created_at desc);

-- ---------- RLS ----------
alter table public.lead_events enable row level security;

-- Anyone (member or guest) can record their own conversion events.
drop policy if exists "lead_events_insert_open" on public.lead_events;
create policy "lead_events_insert_open" on public.lead_events
  for insert to anon, authenticated with check (true);

-- Members read their own events; admins read everything (funnels).
drop policy if exists "lead_events_select_own_or_admin" on public.lead_events;
create policy "lead_events_select_own_or_admin" on public.lead_events
  for select using (public.is_admin() or member_id = auth.uid());
