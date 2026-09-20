-- ============================================================
-- P2 #9 slice 1: public member profiles (learn/build/volunteer portfolio).
--
-- * `profiles_public` view: only approved members, only SAFE columns —
--   no phone, email, age, or gender leak to the public.
-- * Portfolio stats computed live-ish: approved posts (stored),
--   events attended (approved events only), lessons completed.
-- * Reads match the platform pattern (events_public): view owner
--   bypasses row-level security; PostgREST exposes it to anon.
--
-- Apply: Supabase dashboard -> SQL Editor (or CLI runner).
-- ============================================================

create or replace view public.profiles_public as
select
  p.id,
  p.full_name,
  p.role,
  p.occupation,
  p.interests,
  p.career_goal,
  p.xp,
  p.avatar_url,
  p.verified_contributor,
  p.approved_posts,
  p.created_at,
  p.updated_at,
  (
    select count(*)
    from public.event_rsvps r
    join public.events e on e.id = r.event_id
    where r.member_id = p.id
      and e.status = 'approved'
  ) as events_attended,
  (
    select count(*)
    from public.lesson_progress lp
    where lp.member_id = p.id
  ) as lessons_completed
from public.profiles p
where p.status = 'approved';

grant select on public.profiles_public to anon, authenticated, service_role;

-- sanity check (returns the approved members readable by anon)
select full_name, xp, approved_posts, verified_contributor, events_attended, lessons_completed
from public.profiles_public order by xp desc;