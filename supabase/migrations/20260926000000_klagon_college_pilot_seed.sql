-- ============================================================================
-- KLAGON COLLEGE → klagon.org /learning/  (PHASE-1 SEED, additive & idempotent)
-- ----------------------------------------------------------------------------
-- Source of truth: content/learning/klagon-college/  (single ownership).
-- Rules honored (MASTER BUILD PROMPT + 00-CURRICULUM-ARCHITECTURE.md):
--   * EXTEND, DON'T DESTROY  — no table is dropped, no live course is renamed.
--   * SINGLE OWNERSHIP        — the 6 live college courses already exist on the
--     platform (courses table); we map college skill tokens ONTO them and never
--     insert duplicates. The capstone CAP-001 is the only NEW course we add.
--   * NO FAKE CATALOGUE       — only the 6 live + 1 capstone are seeded here;
--     coming-soon courses stay in the college catalogue (content layer), not DB.
--   * IDEMPOTENT              — safe to re-run; guards on every insert.
-- Re-runnable: YES. Destructive: NO.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) skills taxonomy tokens (durable + tool, per data/skills-taxonomy.json)
-- ----------------------------------------------------------------------------
create table if not exists public.skill_tokens (
  token     text primary key,
  category  text not null check (category in ('durable', 'tool')),
  label     text not null,
  created_at timestamptz not null default now()
);

insert into public.skill_tokens (token, category, label) values
  ('communication','durable','Communication'),
  ('storytelling','durable','Storytelling'),
  ('presentation','durable','Presentation'),
  ('financial-literacy','durable','Financial literacy'),
  ('budgeting','durable','Budgeting'),
  ('cash-flow','durable','Cash-flow management'),
  ('career-strategy','durable','Career strategy'),
  ('professional-identity','durable','Professional identity'),
  ('negotation','durable','Negotiation'),
  ('project-leadership','durable','Project leadership'),
  ('collaboration','durable','Collaboration'),
  ('community-development','durable','Community development'),
  ('ai-literacy','durable','AI literacy'),
  ('prompting','durable','Prompting'),
  ('workflow-automation','durable','Workflow automation'),
  ('digital-productivity','durable','Digital productivity'),
  ('opportunity-recognition','durable','Opportunity recognition'),
  ('validation','durable','Validation'),
  ('pricing','durable','Pricing'),
  ('sales','durable','Sales'),
  ('digital-literacy','tool','Digital literacy'),
  ('digital-safety','tool','Digital safety'),
  ('digital-productivity','tool','Digital productivity'),
  ('photography','tool','Photography'),
  ('visual-literacy','tool','Visual literacy'),
  ('typography','tool','Typography'),
  ('branding','tool','Branding'),
  ('prototyping','tool','Prototyping'),
  ('freelancing','tool','Freelancing'),
  ('remote-work','tool','Remote work'),
  ('visual-storytelling','tool','Visual storytelling'),
  ('professional-brand','tool','Professional brand')
on conflict (token) do nothing;

-- durable tokens still in the master taxonomy that pilot skills map to, so the
-- taxonomy stays the single source of truth for the full college catalogue:
insert into public.skill_tokens (token, category, label) values
  ('creativity','durable','Creativity'),
  ('problem-solving','durable','Problem-solving'),
  ('leadership','durable','Leadership'),
  ('entrepreneurship','durable','Entrepreneurship'),
  ('ethical-reasoning','durable','Ethical reasoning'),
  ('research','tool','Research'),
  ('visual-thinking','tool','Visual thinking'),
  ('digital-print','tool','Digital print'),
  ('packaging','tool','Packaging'),
  ('content-marketing','tool','Content marketing'),
  ('customer-discovery','tool','Customer discovery')
on conflict (token) do nothing;

-- ----------------------------------------------------------------------------
-- 2) course → skill-token mapping (single ownership; maps ONTO existing rows)
-- ----------------------------------------------------------------------------
create table if not exists public.course_skills (
  course_id uuid not null references public.courses(id) on delete cascade,
  token     text not null references public.skill_tokens(token) on delete cascade,
  primary key (course_id, token)
);

-- grouped by the live college course title (each maps to exactly one existing course)
do $$
declare
  c_id uuid;
begin
  -- Introduction to AI → CCC-AI-01
  select id into c_id from public.courses where title = 'Introduction to AI' limit 1;
  if c_id is not null then
    insert into public.course_skills (course_id, token) values
      (c_id,'ai-literacy'),(c_id,'prompting'),(c_id,'workflow-automation'),(c_id,'critical-thinking')
    on conflict (course_id, token) do nothing;
  end if;

  -- Communication That Wins → CCC-COM-01
  select id into c_id from public.courses where title = 'Communication That Wins' limit 1;
  if c_id is not null then
    insert into public.course_skills (course_id, token) values
      (c_id,'communication'),(c_id,'storytelling'),(c_id,'presentation')
    on conflict (course_id, token) do nothing;
  end if;

  -- Financial Literacy Basics → CCC-FIN-01
  select id into c_id from public.courses where title = 'Financial Literacy Basics' limit 1;
  if c_id is not null then
    insert into public.course_skills (course_id, token) values
      (c_id,'financial-literacy'),(c_id,'budgeting'),(c_id,'cash-flow')
    on conflict (course_id, token) do nothing;
  end if;

  -- Build Your Career Roadmap → CCC-CAR-01
  select id into c_id from public.courses where title = 'Build Your Career Roadmap' limit 1;
  if c_id is not null then
    insert into public.course_skills (course_id, token) values
      (c_id,'career-strategy'),(c_id,'professional-identity')
    on conflict (course_id, token) do nothing;
  end if;

  -- Leadership Foundations → CCC-LEA-01
  select id into c_id from public.courses where title = 'Leadership Foundations' limit 1;
  if c_id is not null then
    insert into public.course_skills (course_id, token) values
      (c_id,'project-leadership'),(c_id,'leadership'),(c_id,'collaboration')
    on conflict (course_id, token) do nothing;
  end if;

  -- Start Your First Business → CCC-WOR-01
  select id into c_id from public.courses where title = 'Start Your First Business' limit 1;
  if c_id is not null then
    insert into public.course_skills (course_id, token) values
      (c_id,'opportunity-recognition'),(c_id,'validation'),(c_id,'pricing'),(c_id,'sales'),(c_id,'entrepreneurship')
    on conflict (course_id, token) do nothing;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3) capstone — the only NEW course (single new owner: Klagon College)
-- ----------------------------------------------------------------------------
insert into public.courses (title, category, icon, description, published)
select 'Klagon College Capstone', 'Capstone', '🎓',
       'A real project that proves you can apply your Klagon College skills: build, ship, and document something that matters to Klagon.',
       true
where not exists (select 1 from public.courses where title = 'Klagon College Capstone');
