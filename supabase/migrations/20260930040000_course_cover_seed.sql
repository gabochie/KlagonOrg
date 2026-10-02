-- Course feature images — seed the authored cover for each course that has one.
--
-- Idempotent and additive: this only sets cover_url where a real, committed
-- cover exists. Everything else keeps cover_url = null and falls back to the
-- branded per-school/category template chosen in src/lib/courseCover.ts, so no
-- course is ever left imageless.
--
-- Values are BASE paths with no size suffix. The renderer appends -600.webp or
-- -1200.webp, so one column serves both the card and the hero. See
-- scripts/build-course-art.mjs, which produces those derivatives.
--
-- courses has no stable token column, so matching is by exact title.

update public.courses
   set cover_url = '/brand/learning/SOE-VEN-01'
 where title = 'Launch a Real Side Business in 90 Days'
   and cover_url is distinct from '/brand/learning/SOE-VEN-01';
