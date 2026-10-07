-- ============================================================================
-- AI SPRINT PILOT — paid PRO course + lessons (additive, idempotent)
-- Source of truth for copy: content/learning/klagon-college/syllabi/SOT-AI-01-full-course.md
-- Sales pages: /go/ai-sprint (B2C, GH₵150) · /go/ai-sprint-team (B2B team pack)
-- The free live course ("Automate 3 Tasks at Work with AI") is untouched;
-- this PRO row is the sellable sprint the sales pages point at once its id
-- is wired into SalesCta. B2B team pack is concierge (WhatsApp + invoice),
-- no new payments code.
-- Re-runnable: YES. Destructive: NO.
-- ============================================================================

insert into public.courses (title, category, icon, description, published, price_ghs)
select
  'Automate 3 Tasks at Work with AI — PRO Sprint',
  'Future Skills',
  '🤖',
  'A 2-week, phone-only sprint. Automate 3 real tasks, ship a blueprint + demo, earn a certificate. GH₵150 one-time, MoMo, lifetime access.',
  true,
  150
where not exists (
  select 1 from public.courses
  where title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
);

-- 5 lessons (short seed bodies; full copy lives in the syllabus markdown).
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Pick 3 tasks worth automating', 20,
  '# Pick 3 tasks worth automating\n\nList every repeat task, score on frequency x pain, time the top 5 for 2 days, and commit to 3. Evidence: score sheet + baseline times. Full copy: content/learning/klagon-college/syllabi/SOT-AI-01-full-course.md',
  0
from public.courses c
where c.title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Prompt like a supervisor, not a beggar', 20,
  '# Prompt like a supervisor\n\nRole, task, constraints, format. Three reusable prompts + safety checks (no PINs, verify numbers, re-run once). Evidence: 3 prompts + outputs.',
  1
from public.courses c
where c.title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Build your 3-task blueprint', 30,
  '# Build the blueprint\n\nFree/mobile stack only: notes, free AI, Docs/Sheets, WhatsApp Business. Trigger, AI step, human check, send. Evidence: blueprint doc with screenshots.',
  2
from public.courses c
where c.title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Go live + measure hours saved', 20,
  '# Go live for 7 days\n\nRun all 3 on real work, log time/errors daily, fix the smallest break first. Privacy + MoMo-fraud check included. Evidence: 7-day log.',
  3
from public.courses c
where c.title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Showcase + certificate', 20,
  '# Showcase + certificate\n\nOne-page blueprint + 2-min phone demo. Reviewed in 48h. Pass earns certificate + Skills Passport badge. Evidence: PDF + demo link.',
  4
from public.courses c
where c.title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;
