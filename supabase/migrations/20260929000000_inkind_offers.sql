-- Non-financial donation requests: in-kind offers (devices, connectivity,
-- skilled hours, visibility, hosting, venue). Anyone (member or guest) can
-- offer; only admins can read and review. Team is alerted via the existing
-- pledge notify path (no worker change needed).

create table if not exists public.inkind_offers (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.profiles(id) on delete set null,
  category text not null
    check (category in ('devices', 'connectivity', 'skills', 'visibility', 'hosting', 'venue', 'other')),
  title text not null,
  description text,
  full_name text not null,
  phone text not null,
  email text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'accepted', 'declined')),
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.inkind_offers enable row level security;

-- Anyone can offer (members and guests alike).
drop policy if exists "inkind_offers_insert_open" on public.inkind_offers;
create policy "inkind_offers_insert_open" on public.inkind_offers
  for insert to anon, authenticated with check (true);

-- Members read their own offers; admins read everything.
drop policy if exists "inkind_offers_select_own_or_admin" on public.inkind_offers;
create policy "inkind_offers_select_own_or_admin" on public.inkind_offers
  for select using (public.is_admin() or member_id = auth.uid());

-- Only admins review.
drop policy if exists "inkind_offers_admin_write" on public.inkind_offers;
create policy "inkind_offers_admin_write" on public.inkind_offers
  for update using (public.is_admin()) with check (public.is_admin());
