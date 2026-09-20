-- ============================================================
-- Arts & Culture hub — horizontal tagging for events.
-- events.tags text[] lets culture (and later sports/faith/theme)
-- be flagged without touching the event_type enum. The public
-- view exposes tags so the /culture hub can filter approved
-- events by tag overlap.
-- Run AFTER 20260921020000_public_member_profiles.sql.
-- ============================================================

alter table public.events
  add column if not exists tags text[] not null default '{}';

create index if not exists events_tags_idx on public.events using gin (tags);

-- Higher-priority culture tags sort first within date order.
drop view if exists public.events_public;
create view public.events_public as
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
group by e.id
order by e.date asc;

alter view public.events_public set (security_invoker = true);
grant select on public.events_public to anon, authenticated;