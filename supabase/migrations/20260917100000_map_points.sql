-- ============================================================
-- KlagonStudios — map_points: the Klagon Map geographic layer
-- One polymorphic table = one "Map Object". Every geo-tagged
-- thing (project, event, business, school, health, place of
-- worship, community need, facility) is a row, so the map can
-- grow without ALTERing any existing domain table.
-- ============================================================

-- ---------- enums ----------
create type public.map_entity_type as enum (
  'project', 'event', 'business', 'school', 'health', 'faith',
  'community', 'facility', 'governance', 'need', 'sponsor'
);

create type public.map_severity as enum ('low', 'medium', 'high', 'critical');

-- ---------- table ----------
create table public.map_points (
  id uuid primary key default gen_random_uuid(),
  entity_type public.map_entity_type not null,
  entity_id uuid,                                    -- FK to domain entity when one exists (e.g. projects.id)
  name text not null,
  description text,
  category text,                                     -- human label, e.g. "School", "Fuel Station"
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  community_area text not null default 'Klagon',     -- "Klagon" | "Greater Klagon" | ...
  severity public.map_severity,                      -- for needs / issues only
  icon text default '📍',
  status public.member_status not null default 'pending',
  source text not null default 'manual',             -- 'manual' | 'osm' | 'report'
  reported_by uuid references public.profiles(id) on delete set null,
  moderated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index map_points_status_idx on public.map_points (status);
create index map_points_type_idx on public.map_points (entity_type);
create index map_points_latlng_idx on public.map_points (latitude, longitude);

create trigger map_points_touch_updated_at
  before update on public.map_points
  for each row execute procedure public.touch_updated_at();

-- ---------- RLS ----------
alter table public.map_points enable row level security;

-- Public can always read approved points.
create policy "map_points_read_approved" on public.map_points
  for select using (status = 'approved');

-- Reporters can see their own still-pending submissions.
create policy "map_points_read_own_pending" on public.map_points
  for select using (auth.uid() = reported_by and status <> 'approved');

-- Anonymous/approved-member submissions land as 'pending' (Turnstile-gated on the client).
create policy "map_points_insert_open" on public.map_points
  for insert to anon, authenticated with check (status = 'pending');

-- Admins moderate everything (approve / reject via moderate_map_point).
create policy "map_points_admin_all" on public.map_points
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- public view (same pattern as events_public / projects_public) ----------
create or replace view public.map_points_public as
select
  mp.id,
  mp.entity_type,
  mp.entity_id,
  mp.name,
  mp.description,
  mp.category,
  mp.latitude,
  mp.longitude,
  mp.community_area,
  mp.severity,
  mp.icon,
  mp.created_at
from public.map_points mp
where mp.status = 'approved'
order by mp.name asc;

grant select on public.map_points_public to anon, authenticated;

-- ---------- moderation RPC (admin approves/rejects with an audit trail) ----------
create or replace function public.moderate_map_point(
  p_map_id uuid,
  p_status public.member_status
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  update public.map_points
     set status = p_status, moderated_by = auth.uid(), updated_at = now()
   where id = p_map_id;

  perform public.log_audit(
    'map_point_moderate',
    'map_points',
    p_map_id::text,
    jsonb_build_object('status', p_status)
  );
end;
$$;

-- Lock the moderation RPC to signed-in users (internal is_admin() guard
-- already fails closed for non-admins; this removes the anon path so the
-- security advisor stays clean).
revoke all on function public.moderate_map_point(uuid, public.member_status) from public, anon;
grant execute on function public.moderate_map_point(uuid, public.member_status) to authenticated;