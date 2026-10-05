-- Course feature images — wire every remaining published course to its authored cover.
--
-- This completes the set seeded by 20260930040000_course_cover_seed.sql. After this
-- migration, all 10 published courses carry a real cover_url; none fall back to the
-- branded per-school/category templates in src/lib/courseCover.ts.
--
-- Idempotent and additive: it only sets cover_url where a real, committed cover
-- exists, and skips rows already holding the correct value. Rows with no authored
-- art keep cover_url = null so the template fallback still applies.
--
-- Values are BASE paths with no size suffix. The renderer appends -600.webp or
-- -1200.webp, and resolveCourseOg appends -og.jpg, so one column serves the card,
-- the hero and the social image. See scripts/build-course-art.mjs.
--
-- courses has no stable token column, so matching is by exact title.

update public.courses
   set cover_url = '/brand/learning/SOT-AI-01'
 where title = 'Automate 3 Tasks at Work with AI'
   and cover_url is distinct from '/brand/learning/SOT-AI-01';

update public.courses
   set cover_url = '/brand/learning/CCC-FIN-01'
 where title = 'Build Your First Savings Habit and Budget'
   and cover_url is distinct from '/brand/learning/CCC-FIN-01';

update public.courses
   set cover_url = '/brand/learning/CCC-LEA-01'
 where title = 'Lead Your First Community Project'
   and cover_url is distinct from '/brand/learning/CCC-LEA-01';

update public.courses
   set cover_url = '/brand/learning/CCC-COM-01'
 where title = 'Deliver a Talk People Remember'
   and cover_url is distinct from '/brand/learning/CCC-COM-01';

update public.courses
   set cover_url = '/brand/learning/CCC-CAR-01'
 where title = 'Get Ready for Your First Job or Client'
   and cover_url is distinct from '/brand/learning/CCC-CAR-01';

update public.courses
   set cover_url = '/brand/learning/SOT-IT-01'
 where title = 'Phone Ready - Start IT with Phone'
   and cover_url is distinct from '/brand/learning/SOT-IT-01';

update public.courses
   set cover_url = '/brand/learning/SOT-IT-02'
 where title = 'Build Your First Web Page'
   and cover_url is distinct from '/brand/learning/SOT-IT-02';

update public.courses
   set cover_url = '/brand/learning/SOT-IT-03'
 where title = 'Forms, Photos & Tables'
   and cover_url is distinct from '/brand/learning/SOT-IT-03';

update public.courses
   set cover_url = '/brand/learning/SOT-IT-04'
 where title = 'Publish Pro Site'
   and cover_url is distinct from '/brand/learning/SOT-IT-04';

-- Fail loudly if any published course is still left imageless or on a template,
-- so a bad title above cannot pass CI unnoticed.
do $$
declare
  missing text;
begin
  select string_agg(title, ', ' order by title)
    into missing
    from public.courses
   where cover_url is null;

  if missing is not null then
    raise exception 'published course(s) still missing cover_url: %', missing;
  end if;
end $$;