-- IT Tracks 0+1: quiz model, course prerequisites, completion gating.
-- Idempotent: all objects use IF NOT EXISTS / OR REPLACE / DROP+CREATE for policies.
-- Mirrors the existing lesson_progress / award_lesson_xp / RLS patterns.

-- ---------- course prerequisites ----------
alter table public.courses
  add column if not exists prerequisite_course_id uuid
  references public.courses(id) on delete set null;

-- ---------- quizzes ----------
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  pass_score int not null check (pass_score >= 1),
  badge_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  sort_order int not null default 0,
  kind text not null check (kind in ('recall', 'fix-it')),
  stem text not null,
  options jsonb not null,
  correct_index int not null check (correct_index between 0 and 2),
  explanation text,
  unique (quiz_id, sort_order)
);

create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score int not null check (score >= 0),
  passed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "quizzes_read_public" on public.quizzes;
create policy "quizzes_read_public" on public.quizzes
  for select using (exists (
    select 1 from public.lessons l
    join public.courses c on c.id = l.course_id
    where l.id = quizzes.lesson_id and c.published = true
  ));

drop policy if exists "quizzes_admin_all" on public.quizzes;
create policy "quizzes_admin_all" on public.quizzes
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quiz_questions_read_public" on public.quiz_questions;
create policy "quiz_questions_read_public" on public.quiz_questions
  for select using (exists (
    select 1 from public.quizzes q
    join public.lessons l on l.id = q.lesson_id
    join public.courses c on c.id = l.course_id
    where q.id = quiz_questions.quiz_id and c.published = true
  ));

drop policy if exists "quiz_questions_admin_all" on public.quiz_questions;
create policy "quiz_questions_admin_all" on public.quiz_questions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "quiz_attempts_select_own" on public.quiz_attempts;
create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select using (member_id = auth.uid());

drop policy if exists "quiz_attempts_write_self" on public.quiz_attempts;
create policy "quiz_attempts_write_self" on public.quiz_attempts
  for insert with check (member_id = auth.uid() and public.is_approved_member());

drop policy if exists "quiz_attempts_admin_all" on public.quiz_attempts;
create policy "quiz_attempts_admin_all" on public.quiz_attempts
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- quiz XP (+10 on first pass, mirrors award_lesson_xp) ----------
create or replace function public.award_quiz_xp()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.passed and not exists (
    select 1 from public.quiz_attempts
    where member_id = NEW.member_id and quiz_id = NEW.quiz_id and passed and id <> NEW.id
  ) then
    update public.profiles set xp = coalesce(xp, 0) + 10 where id = NEW.member_id;
  end if;
  if NEW.passed then
    insert into public.member_badges (member_id, badge_id)
    select NEW.member_id, b.id
    from public.badges b
    join public.quizzes q on q.badge_name = b.name
    where q.id = NEW.quiz_id and q.badge_name is not null
    on conflict (member_id, badge_id) do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_award_quiz_xp on public.quiz_attempts;
create trigger trg_award_quiz_xp
after insert on public.quiz_attempts
for each row execute function public.award_quiz_xp();

-- ---------- completion gating: quiz pass + prerequisite chain ----------
create or replace function public.lesson_completion_allowed(p_lesson_id uuid, p_member_id uuid)
returns boolean
language sql
stable
security definer
as $$
  select
    (not exists (select 1 from public.quizzes q where q.lesson_id = p_lesson_id)
     or exists (
       select 1 from public.quiz_attempts a
       join public.quizzes q on q.id = a.quiz_id
       where q.lesson_id = p_lesson_id and a.member_id = p_member_id and a.passed
     ))
    and
    (not exists (
      with recursive ancestors(id) as (
        select c.prerequisite_course_id
        from public.courses c
        join public.lessons l on l.course_id = c.id and l.id = p_lesson_id
        where c.prerequisite_course_id is not null
        union
        select c.prerequisite_course_id
        from public.courses c
        join ancestors a on c.id = a.id
        where c.prerequisite_course_id is not null
      )
      select 1
      from ancestors a
      join public.lessons l on l.course_id = a.id
      where not exists (
        select 1 from public.lesson_progress p
        where p.lesson_id = l.id and p.member_id = p_member_id
      )
    ));
$$;

drop policy if exists "lesson_progress_write_self" on public.lesson_progress;
create policy "lesson_progress_write_self" on public.lesson_progress
  for insert with check (
    member_id = auth.uid()
    and public.is_approved_member()
    and public.lesson_completion_allowed(lesson_id, member_id)
  );

-- ---------- IT track badges (awarded by trg_award_quiz_xp on final passes) ----------
insert into public.badges (name, icon) values
  ('Digital Ready - Klagon', '📱'),
  ('HTML Starter', '🌐'),
  ('HTML Order-Taker', '📝'),
  ('HTML Builder - Klagon', '🚀')
on conflict (name) do nothing;
