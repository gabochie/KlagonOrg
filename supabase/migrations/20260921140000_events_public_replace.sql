-- ============================================================
-- Arts & Culture hub follow-up: recreate events_public with
-- CREATE OR REPLACE (preserves dependents) and drop the ORDER BY
-- from the view definition — ORDER BY without LIMIT is ignored
-- by Postgres; callers order explicitly (see fetchCultureEvents).
-- Run AFTER 20260921120000_culture_hub.sql.
-- ============================================================

create or replace view public.events_public as
select
  e.id,
  e.title,
  e.type,
  e.tags,
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
where e.status = 'approved'
group by e.id;

alter view public.events_public set (security_invoker = true);
grant select on public.events_public to anon, authenticated;
