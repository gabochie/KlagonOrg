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
--   * TOKENS STAY IN JSON     — skill-token ROWS are NOT hand-typed here.
--     The college's skills taxonomy lives only in data/skills-taxonomy.json
--     (single source). Before ANY token row is inserted at runtime, run:
--       node scripts/seed-klagon-college.mjs --dry-run
--     which emits idempotent token inserts compiled from that JSON. This file
--     only provides the tables + the capstone so the DB schema and the JSON
--     can never drift. (The seeder is committed next to the other seeders.)
--   * IDEMPOTENT              — safe to re-run; guards on every insert.
-- Re-runnable: YES. Destructive: NO.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) skills taxonomy tokens (durable + tool) — rows emitted by the node seeder
-- ----------------------------------------------------------------------------
create table if not exists public.skill_tokens (
  token     text primary key,
  category  text not null check (category in ('durable', 'tool')),
  label     text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2) course → skill-token mapping (single ownership; maps ONTO existing rows)
-- ----------------------------------------------------------------------------
create table if not exists public.course_skills (
  course_id uuid not null references public.courses(id) on delete cascade,
  token     text not null,
  primary key (course_id, token)
);
-- NOTE: no FK from token -> skill_tokens on purpose. Token VALUES are owned by
-- data/skills-taxonomy.json (single source of truth); the validator
-- (scripts/validate-klagon-college.mjs) enforces that every token here exists
-- in the taxonomy. A DB FK here would smuggle in a second, driftable source.

-- ----------------------------------------------------------------------------
-- 3) capstone — the only NEW course (single new owner: Klagon College)
-- ----------------------------------------------------------------------------
insert into public.courses (title, category, icon, description, published)
select 'Klagon College Capstone', 'Capstone', '🎓',
       'A real project that proves you can apply your Klagon College skills: build, ship, and document something that matters to Klagon.',
       true
where not exists (select 1 from public.courses where title = 'Klagon College Capstone');
