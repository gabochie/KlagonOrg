-- ============================================================
-- KlagonStudios — public content views
-- Expose published content + aggregate counts without leaking
-- RLS-restricted append-only data (rsvps / volunteers / lessons).
-- Views run as owner (postgres), bypassing the per-row policies of
-- the underlying tables, so only these views are public.
-- ============================================================

create or replace view public.events_public as
select
  e.id,
  e.title,
  e.type,
  e.description,
  e.date,
  e.time,
  e.location,
  e.spots,
  e.created_by,
  e.created_at,
  count(r.id)::int                       as rsvp_count,
  greatest(e.spots - count(r.id), 0)::int as spots_left
from public.events e
left join public.event_rsvps r on r.event_id = e.id
where e.published = true
group by e.id
order by e.date asc;

create or replace view public.projects_public as
select
  p.id,
  p.title,
  p.description,
  p.icon,
  p.status,
  p.volunteers_target,
  p.progress,
  p.created_by,
  p.created_at,
  count(v.id)::int                        as volunteer_count,
  greatest(p.volunteers_target - count(v.id), 0)::int as spots_open
from public.projects p
left join public.project_volunteers v on v.project_id = p.id
group by p.id
order by p.created_at asc;

create or replace view public.courses_public as
select
  c.id,
  c.title,
  c.category,
  c.icon,
  c.description,
  c.created_at,
  count(l.id)::int as lesson_count
from public.courses c
left join public.lessons l on l.course_id = c.id
where c.published = true
group by c.id
order by c.created_at asc;

grant select on public.events_public to anon, authenticated;
grant select on public.projects_public to anon, authenticated;
grant select on public.courses_public to anon, authenticated;