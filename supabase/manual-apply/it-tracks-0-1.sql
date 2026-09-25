-- ONE-TIME manual apply for IT Tracks 0+1 (Phase 1).
-- How: Supabase Dashboard > SQL Editor > New query > paste this entire file > Run.
-- Do NOT move this file into supabase/migrations/ (it would double-apply on db push).
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE / ON CONFLICT).
-- Contents, in order: (1) 20260927000000_it_quiz_schema.sql  (2) 20260927000001_it_tracks_0_1_seed.sql

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

-- Auto-generated by scripts/build-it-courses-seed.cjs. Do not edit by hand.
-- IT Tracks 0 + 1 (Phase 1): 4 courses, 16 lessons, quizzes extracted to quiz tables.
-- Lesson bodies EXCLUDE quiz blocks (rendered by the quiz UI). Re-runnable via upserts.

-- ================= Phone Ready - Start IT with Phone =================
insert into public.courses (title, category, icon, description, published)
select 'Phone Ready - Start IT with Phone', 'Future Skills', '📱', 'Setup, files, low-data internet + safety - become unstoppable with just a phone.', true
where not exists (select 1 from public.courses where title = 'Phone Ready - Start IT with Phone');

-- Phone Ready - Start IT with Phone :: lesson 0 — Your Phone is Your First Computer Lab (11 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Your Phone is Your First Computer Lab', 11, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIHR1cm4gYW55IEFuZHJvaWQgcGhvbmUgaW50byBhIGNsYXNzcm9vbToga2V5Ym9hcmQsIHN0b3JhZ2UsIGFuZCBBY29kZSBmb3IgSFRNTC4KCiMjIyBTdG9yeSBob29rICg5MCBzZWMpCkFtYSdzIHBob25lIHNheXMgIlN0b3JhZ2UgRnVsbCIgd2hlbiBjdXN0b21lciBzZW5kcyBvcmRlci4gU2hlIGRlbGV0ZXMgcGhvdG9zIGNyeWluZy4gV2Ugc3RvcCB0aGF0IHRvZGF5LgoKIyMjIERlbW8KMS4gQ2hlY2sgc3RvcmFnZTogU2V0dGluZ3MgPiBTdG9yYWdlIC0gbmVlZCA1MDBNQiBmcmVlLiBEZWxldGUgV2hhdHNBcHAgdmlkZW9zID4gQ2xlYXIgY2FjaGUsIG5vdCBjaGF0cy4KMi4gQWRkIGtleWJvYXJkOiBJbnN0YWxsIEdib2FyZCwgdHVybiBvbiBhdXRvY29ycmVjdCwgcHJhY3RpY2UgdHlwaW5nIGA8PmAgYnJhY2tldHMgLSB5b3UgbmVlZCB0aGVtIGZvciBIVE1MLgozLiBJbnN0YWxsIGNsYXNzcm9vbSBhcHBzIChsb3cgZGF0YSwgYWxsIGZyZWUpOiBDaHJvbWUsIEFjb2RlIChjb2RlIGVkaXRvciksIEdvb2dsZSBEcml2ZSAoMTVHQiBmcmVlIGNsb3VkKS4KNC4gTWFrZSBsZWFybmluZyBmb2xkZXI6IEZpbGVzIGFwcCA+IENyZWF0ZSBgS0xBR09OLUlUYCBmb2xkZXIuCgo+ICoqUnVsZToqKiBvbmUgcGxhY2UgZm9yIGxlYXJuaW5nLiBFdmVyeXRoaW5nIElUIGdvZXMgaW4gS0xBR09OLUlULCBub3doZXJlIGVsc2UuCgo+ICoqV2h5IGl0IHdvcmtzICh0aGVvcnkgaW4gMyBsaW5lcyk6KiogUGhvbmUgc3RvcmFnZSBpcyBsaWtlIGEgY2hvcC1ib3ggLSBmdWxsIGJveCBjYW4ndCBhZGQuIEFwcHMgbmVlZCBmcmVlIFJBTSB0byBydW4sIGNhY2hlIGlzIGxlZnRvdmVyIHdyYXAuIE9uZSBmb2xkZXIgcmVkdWNlcyBzZWFyY2ggcGF0aCwgc28gYnJhaW4gKyBGaWxlcyBhcHAgZmluZCBpbiAzIHNlYy4KCiMjIyBUcnkgaXQgKHBob25lL3BhcGVyKQoxLiBGcmVlIDUwME1CLCBzY3JlZW5zaG90IGJlZm9yZS9hZnRlci4KMi4gVHlwZSB0aGlzIGluIEFjb2RlIDV4IGZhc3Q6IGA8aDE+SGVsbG8gS2xhZ29uPC9oMT5gIC0gdGltZSB5b3Vyc2VsZi4KMy4gQ3JlYXRlIEtMQUdPTi1JVCBmb2xkZXIgd2l0aCBzdWJmb2xkZXJzOiBgaHRtbGAsIGBwaG90b3NgLCBgYmFja3VwYC4KCiMjIyBCb3NzIENoYWxsZW5nZSAoNjAtc2VjIGJ1aWxkKQpGcmllbmQgc2hvdXRzIGEgd29yZCwgeW91IHR5cGUgYDxwPndvcmQ8L3A+YCBjb3JyZWN0bHkgaW4gdW5kZXIgMjAgc2VjLgoKIyMjIFN1bW1hcnkKLSBQaG9uZSArIEFjb2RlICsgQ2hyb21lID0gZnVsbCBzdGFydGVyIGxhYgotIEtMQUdPTi1JVCBmb2xkZXIgPSB5b3VyIG9mZmljZQotIEJyYWNrZXRzIHR5cGluZyA9IEhUTUwgc3VwZXJwb3dlcgoKWysxMCBYUF0=','base64'),'utf8'), 0
from public.courses c where c.title = 'Phone Ready - Start IT with Phone'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 0
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 0
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Where does IT work live?', '["everywhere","KLAGON-IT folder","WhatsApp videos"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'App for coding HTML on phone?', '["Acode","Calculator","Camera"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Friend saves index.html in WhatsApp Videos, can''t find next day. Fix?', '["search all + move to KLAGON-IT/html","delete all","rename phone"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'You type `<H1>Hello` and preview blank. Fix?', '["add closing `</h1>` lowercase + save as .html","shout louder","buy laptop"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 0

-- Phone Ready - Start IT with Phone :: lesson 1 — Files That Don't Disappear (11 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Files That Don''t Disappear', 11, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIG5hbWUsIGZpbmQsIGFuZCBiYWNrdXAgZmlsZXMgbGlrZSBhbiBJVCBTdXBwb3J0IHNwZWNpYWxpc3QuCgojIyMgU3RvcnkgaG9vawpBbWEgbG9zdCBwcmljZSBsaXN0IC0gbmFtZWQgYG5ldyBkb2MgKDIpIGZpbmFsYC4gQ3VzdG9tZXIgd2FpdGVkIDIgZGF5cy4gV2UgZml4IG5hbWluZyBmb3JldmVyLgoKIyMjIERlbW8KQmFkIHZzIEdvb2Q6CmBgYApCQUQ6IElNR18yMDI2MDEwMS5qcGcsIG5ldyBkb2MsIFVudGl0bGVkCkdPT0Q6IGJha2VyeS1wcmljZS0yMDI2LTA5LnR4dCwgYW1hLXNob3AtZnJvbnQuanBnLCBzZXB0LW9yZGVycy5jc3YKYGBgCkZvcm11bGE6IGB3aGF0LXdoZXJlLXdoZW4uZXh0YCBsb3dlcmNhc2UtaHlwaGVucywgbm8gc3BhY2VzLgoKQmFja3VwIGluIDIgbWluOgoxLiBEcml2ZSBhcHAgPiArID4gVXBsb2FkIGBiYWtlcnktcHJpY2VgIGZpbGUKMi4gVHVybiBvbjogUGhvdG9zID4gQmFja3VwIChjb21wcmVzc2VkID0gc2F2ZXMgZGF0YSkKMy4gUGFwZXIgYmFja3VwOiB3cml0ZSAzIGN1c3RvbWVyIG51bWJlcnMgaW4gbm90ZWJvb2sgLSBjbG91ZCArIHBhcGVyID0gcHJvLgoKRmluZCBmYXN0OiBGaWxlcyBhcHAgPiBTZWFyY2ggYGJha2VyeS1wcmljZWAgLSBpZiB5b3UgbmFtZWQgd2VsbCwgMyBzZWMuCgo+ICoqV2h5IGl0IHdvcmtzICh0aGVvcnkgaW4gMyBsaW5lcyk6KiogQ29tcHV0ZXIgZmluZHMgYnkgZXhhY3Qgc3RyaW5nIG1hdGNoLCBub3QgbWVhbmluZyAtIGBUZWFgIOKJoCBgdGVhYC4gU3BhY2VzIGJyZWFrIGxpbmtzIGFuZCBjb21tYW5kcywgaHlwaGVucyBkb24ndC4gU2Vjb25kIGNvcHkgaW4gZGlmZmVyZW50IHBsYWNlIHN1cnZpdmVzIHRoZWZ0L3JhaW4gYmVjYXVzZSBmYWlsdXJlcyByYXJlbHkgaGl0IGJvdGguCgojIyMgVHJ5IGl0CjEuIFJlbmFtZSA1IGZpbGVzIHVzaW5nIGZvcm11bGEuCjIuIFVwbG9hZCAxIGZpbGUgdG8gRHJpdmUsIGdldCBsaW5rLCBzZW5kIHRvIHlvdXJzZWxmIG9uIFdoYXRzQXBwLgozLiBEZWxldGUgMUdCIHZpZGVvcyBhZnRlciBiYWNrdXAgLSBjZWxlYnJhdGUgZnJlZWQgc3BhY2UuCgojIyMgQm9zcyBDaGFsbGVuZ2UKU3BvdC10aGUtYnVnOiB3aGljaCBuYW1lIHdpbnM/IGBNeSBOZXcgRG9jdW1lbnQgRklOQUwgKDMpLmRvY3hgIHZzIGBrbGFnb24tYmFrZXJ5LW1lbnUtc2VwdC50eHRgIC0gZXhwbGFpbiB3aHkgaW4gb25lIHNlbnRlbmNlIHRvIGEgZnJpZW5kLgoKIyMjIFN1bW1hcnkKLSBHb29kIG5hbWUgPSBmb3VuZCBpbiAzIHNlYwotIERyaXZlICsgcGFwZXIgPSBuZXZlciBsb3NlCi0gSVQgU3VwcG9ydCBza2lsbCAjMTogb3JnYW5pemVkIGZpbGVzCgpbKzEwIFhQXQ==','base64'),'utf8'), 1
from public.courses c where c.title = 'Phone Ready - Start IT with Phone'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 1
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 1
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Best name?', '["new doc final","bakery-price-sept.txt","IMG123"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Free Drive size?', '["15GB","15MB","unlimited"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'File named `My New Document FINAL (3).docx` won''t open from link with %20 errors. Fix?', '["rename to `bakery-menu-sept.txt` hyphens","add more spaces","delete Drive"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'You uploaded to Drive but phone lost and can''t login - recovery?', '["use paper backup numbers + recovery phone to login on friend phone","give up","create new shop"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 1

-- Phone Ready - Start IT with Phone :: lesson 2 — Internet on Low Data - Learn Without Chopping Money (11 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Internet on Low Data - Learn Without Chopping Money', 11, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIHVzZSBrbGFnb24ub3JnICsgR29vZ2xlIG9uIDEwME1CIGFuZCBzYXZlIGxlc3NvbnMgb2ZmbGluZS4KCiMjIyBTdG9yeSBob29rCkFtYSBoYXMgMTUwTUIgZm9yIHdlZWsuIFlvdVR1YmUgZWF0cyBpdCBpbiAyMCBtaW4uIFNoZSBzdGlsbCBtdXN0IGxlYXJuIEhUTUwuCgojIyMgRGVtbwpEYXRhIHNhdmVyczoKMS4gQ2hyb21lID4gU2V0dGluZ3MgPiBMaXRlIG1vZGUgLyBEYXRhIHNhdmVyIE9OLgoyLiBrbGFnb24ub3JnIExlYXJuaW5nOiBvcGVuIGxlc3NvbiBvbmNlIG9uIFdpRmkgKFRlbWEgRGlnaXRhbCBIdWIpLCB0aGVuIENocm9tZSBtZW51ID4gRG93bmxvYWQgcGFnZSBmb3Igb2ZmbGluZS4KMy4gU2VhcmNoIGxpa2UgcHJvOiBgc2l0ZTprbGFnb24ub3JnIGJha2VyeWAgLCBgInRlYSBicmVhZCBwcmljZSBUZW1hImAgcXVvdGVzID0gZXhhY3QuCjQuIFdoYXRzQXBwIGxlYXJuaW5nOiBtdXRlIHZpZGVvcyBhdXRvLWRvd25sb2FkOiBXaGF0c0FwcCA+IFNldHRpbmdzID4gU3RvcmFnZSA+IE5vIG1lZGlhIGF1dG8tZG93bmxvYWQgb24gZGF0YS4KClRlc3Q6IExvYWQga2xhZ29uLm9yZy9sZWFybmluZyAtIHNob3VsZCBiZSA8Mk1CLiBJZiA+MTAgc2VjLCBzd2l0Y2ggdG8gRnJlZSBCYXNpY3MgLyB0ZXh0IG1vZGUuCgpPZmZsaW5lIHBhY2s6IGRvd25sb2FkIDEgbGVzc29uICsgc2NyZWVuc2hvdCBjb2RlIHRvIHByYWN0aWNlIHdpdGggZGF0YSBPRkYuCgo+ICoqV2h5IGl0IHdvcmtzICh0aGVvcnkgaW4gMyBsaW5lcyk6KiogRGF0YSA9IHBheWluZyBwZXIgTUIsIHZpZGVvIH41TUIvbWluIHZzIHRleHQgfjAuMDJNQi4gRG93bmxvYWQgb25jZSBvbiBmcmVlIEh1YiBXaUZpIGNhY2hlcyBmaWxlIGxvY2FsbHkuIFNlYXJjaCB3aXRoIHF1b3RlcyB0ZWxscyBHb29nbGUgZXhhY3QgbWF0Y2gsIGN1dHRpbmcgMTAgcGFnZXMgdG8gMS4KCiMjIyBUcnkgaXQKMS4gVHVybiBPRkYgYXV0by1kb3dubG9hZCwgc2F2ZSA1ME1CIHRvZGF5LgoyLiBEb3dubG9hZCAxIGtsYWdvbiBsZXNzb24gZm9yIG9mZmxpbmUuCjMuIFNlYXJjaDogIktsYWdvbiBiYWtlcnkgaG91cnMiIC0gY2FuIHlvdSBhbnN3ZXIgaW4gMzAgc2VjPwoKIyMjIEJvc3MgQ2hhbGxlbmdlCkRhdGEgUmFjZTogd2l0aCAxME1CLCB3aG8gZmluZHMgYmFrZXJ5IFdoYXRzQXBwIG51bWJlciBmYXN0ZXN0IHVzaW5nIHRleHQgc2VhcmNoIG9ubHkgKG5vIHZpZGVvcyk/CgojIyMgU3VtbWFyeQotIE9mZmxpbmUgZmlyc3QgPSByaWNoIGxlYXJuaW5nIG9uIHBvb3IgZGF0YQotIFF1b3RlcyArIHNpdGU6ID0gcHJvIHNlYXJjaAotIE5vIGF1dG8tZG93bmxvYWQgPSBtb25leSBzYXZlZAoKWysxMCBYUF0=','base64'),'utf8'), 2
from public.courses c where c.title = 'Phone Ready - Start IT with Phone'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 2
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 2
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Save data by?', '["autoplay videos","download for offline on WiFi","clear SIM"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Exact search uses?', '["quotes","CAPS","emojis"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', '150MB gone in 1 day, WhatsApp auto-download ON with 20 videos. Fix?', '["turn OFF auto-download on data + download lessons on Hub WiFi","delete WhatsApp","buy 5GB"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Search `bakery` gives 2M results, need klagon bakery hours. Fix?', '["use `\"Klagon bakery hours\" site:klagon.org`","search `b`","watch YouTube"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 2

-- Phone Ready - Start IT with Phone :: lesson 3 — Project - Safe & Ready: Setup + Safety Check (12 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Project - Safe & Ready: Setup + Safety Check', 12, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIGxvY2sgeW91ciBwaG9uZSArIHNwb3QgTW9NbyBmcmF1ZCArIHBhc3MgUmVhZHkgQ2hlY2sgZm9yIGFsbCBJVCB0cmFja3MuCgojIyMgU3RvcnkgaG9vawpBbWEgZ2V0cyBTTVM6ICJZb3VyIE1vTW8gYmxvY2tlZCwgc2VuZCBQSU4gdG8gMDI0WC4iIFNoZSBhbG1vc3Qgc2VuZHMuIFlvdSBzYXZlIGhlci4KCiMjIyBEZW1vIC0gNSBsb2NrcyBpbiAxMCBtaW4KMS4gU2NyZWVuIGxvY2s6IFBJTiA2LWRpZ2l0IChub3QgMTIzNDU2LCBub3QgYmlydGhkYXkpICsgZmluZ2VycHJpbnQuCjIuIFdoYXRzQXBwIGxvY2s6IFdoYXRzQXBwID4gUHJpdmFjeSA+IEZpbmdlcnByaW50IGxvY2sgT04uCjMuIEdvb2dsZSAyRkE6IEdvb2dsZSBhY2NvdW50ID4gU2VjdXJpdHkgPiAyLVN0ZXAgT04gLSB0aGllZiBuZWVkcyB5b3VyIHBob25lICsgY29kZS4KNC4gU3BvdCBzY2FtIC0gMyByZWQgZmxhZ3M6IHVyZ2VuY3kgKCJub3chIiksIFBJTiByZXF1ZXN0IChNVE4gbmV2ZXIgYXNrcyksIHN0cmFuZ2UgbGluayAoYG10bi1naC1mcmVlLmNvbWApLgpgYGAgClJlYWw6IE1UTiBuZXZlciBhc2tzIFBJTi4gU2NhbSBhc2tzIFBJTiArIGNsaWNrcyBsaW5rLgpgYGAKNS4gQmFja3VwOiBjb250YWN0cyArIDEgZmlsZSB0byBEcml2ZS4gTG9zdCBwaG9uZSDiiaAgbG9zdCBidXNpbmVzcy4KCj4gKipSdWxlOioqIFBJTiBpcyBsaWtlIHRvb3RoYnJ1c2ggLSBuZXZlciBzaGFyZSwgY2hhbmdlIGlmIHRvdWNoZWQuCgo+ICoqV2h5IGl0IHdvcmtzICh0aGVvcnkgaW4gMyBsaW5lcyk6KiogUElOL09UUCBpcyBzaW5nbGUgc2VjcmV0IC0gYW55b25lIHdpdGggaXQgYmVjb21lcyB5b3UgdG8gTVROLiAyRkEgYWRkcyBzZWNvbmQgZmFjdG9yIChzb21ldGhpbmcgeW91IGhhdmUgKyBrbm93KSwgc28gc3RvbGVuIHBhc3N3b3JkIGFsb25lIGZhaWxzLiBVcmdlbmN5IGJ5cGFzc2VzIHRoaW5raW5nLCBzbyBwYXVzZSArIHZlcmlmeSB2aWEgc2VwYXJhdGUgY2FsbCBicmVha3Mgc2NhbSBjaGFpbi4KCiMjIyBQcm9qZWN0IENoZWNrbGlzdCAobXVzdCBwYXNzIGFsbCBmb3IgY2VydGlmaWNhdGUpCi0gWyBdIEtMQUdPTi1JVCBmb2xkZXIgd2l0aCBodG1sL3Bob3Rvcy9iYWNrdXAKLSBbIF0gQ2FuIHR5cGUgYDxhIGhyZWY9Ii4uLiI+Li4uPC9hPmAgd2l0aG91dCBsb29raW5nCi0gWyBdIDEgZmlsZSBvbiBEcml2ZSB3aXRoIGxpbmsKLSBbIF0gMSBrbGFnb24gbGVzc29uIHNhdmVkIG9mZmxpbmUKLSBbIF0gU2NyZWVuICsgV2hhdHNBcHAgbG9jayBPTiArIDJGQSBPTgotIFsgXSBFeHBsYWluIDMgc2NhbSBmbGFncyB0byAxIGZhbWlseSBtZW1iZXIgKHNpZ24gcGFwZXIpCgojIyMgVHJ5IGl0IC8gU2hpcCBpdAoxLiBEbyA1IGxvY2tzLCBzY3JlZW5zaG90IHNldHRpbmdzIChoaWRlIFBJTikuCjIuIFRlYWNoIHNjYW0gdGVzdCB0byBtdW0vYnJvdGhlciAtIHRoZXkgbXVzdCBzcG90IGZha2UgU01TIHlvdSB3cml0ZS4KMy4gUG9zdCBpbiBjbGFzcyBXaGF0c0FwcDogIkkgYW0gUkVBRFkgKyBmcmVlIE1CICsgbXkgZm9sZGVyIHBob3RvLiIKCiMjIyBTdW1tYXJ5Ci0gUmVhZHkgPSBvcmdhbml6ZWQgKyBsb3ctZGF0YSArIGxvY2tlZCArIGJhY2tlZCB1cAotIFlvdSBhcmUgbm93IElUIFN1cHBvcnQgTGV2ZWwgMCAtIGhlbHBlciBmb3IgZmFtaWx5Ci0gTmV4dDogVHJhY2sgMSBIVE1MIEJhc2ljIC0geW91IGFscmVhZHkgaGF2ZSBsYWIhCgpbKzEwIFhQICsgQmFkZ2U6IERpZ2l0YWwgUmVhZHkgLSBLbGFnb25d','base64'),'utf8'), 3
from public.courses c where c.title = 'Phone Ready - Start IT with Phone'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, 'Digital Ready - Klagon'
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 3
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 3
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'PIN share?', '["share with MTN staff","never share","share with friend"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Ready folder?', '["KLAGON-IT","Downloads mixed","no folder"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'SMS "MTN blocked, send PIN to 024X + click mtn-gh-free.com". Action?', '["send + click fast","ignore + verify via 100 + check sender MTN MoMo","forward to friends"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Phone shows 0MB, need to save lesson + keep locks. Order?', '["delete locks to free space","clear WhatsApp videos/cache (keep chats) + download on Hub WiFi + keep 2FA ON","factory reset"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Phone Ready - Start IT with Phone' and l.sort_order = 3

-- ================= Build Your First Web Page =================
insert into public.courses (title, category, icon, description, published)
select 'Build Your First Web Page', 'Future Skills', '🌐', 'Create your first page with text, links and images - on phone or paper.', true
where not exists (select 1 from public.courses where title = 'Build Your First Web Page');

update public.courses c set prerequisite_course_id = p.id
from public.courses p
where c.title = 'Build Your First Web Page' and p.title = 'Phone Ready - Start IT with Phone'
  and c.prerequisite_course_id is distinct from p.id;

-- Build Your First Web Page :: lesson 0 — What is HTML? Your First Page in 10 Minutes (11 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'What is HTML? Your First Page in 10 Minutes', 11, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIHVuZGVyc3RhbmQgd2hhdCBIVE1MIGlzIGFuZCBjcmVhdGUgeW91ciBmaXJzdCB3b3JraW5nIHBhZ2UgLSBldmVuIG9uIHBhcGVyIG9yIGEgcGhvbmUuCgojIyMgV2Vic2l0ZXMgYXJlIGp1c3QgZG9jdW1lbnRzIHdpdGggbGFiZWxzCkhUTUwgaXMgbm90IHByb2dyYW1taW5nLiBJdCBpcyBsYWJlbGxpbmcuIExpa2UgbGFiZWxsaW5nIGJveGVzIGluIGEgc2hvcDogImJyZWFkIGhlcmUsIHN1Z2FyIHRoZXJlLiIKCkV4YW1wbGU6IGA8cD5UaGlzIGlzIGJyZWFkPC9wPmAgbWVhbnM6IHRoaXMgaXMgYSBwYXJhZ3JhcGggYWJvdXQgYnJlYWQuCgo+ICoqUnVsZToqKiBvbmUgdGFnIG9wZW5zLCBvbmUgdGFnIGNsb3Nlcy4gQ29udGVudCBsaXZlcyBpbiB0aGUgbWlkZGxlOiBgPHRhZ25hbWU+Y29udGVudDwvdGFnbmFtZT5gCgojIyMgWW91ciBmaXJzdCBwYWdlIHNrZWxldG9uCkV2ZXJ5IEhUTUwgcGFnZSBoYXMgdGhlIHNhbWUgYm9uZXM6CgpgYGBodG1sCjwhRE9DVFlQRSBodG1sPgo8aHRtbD4KPGhlYWQ+CiAgPHRpdGxlPk15IEtsYWdvbiBTaG9wPC90aXRsZT4KPC9oZWFkPgo8Ym9keT4KICA8aDE+SGVsbG8gS2xhZ29uITwvaDE+CiAgPHA+TXkgZmlyc3Qgd2ViIHBhZ2UuPC9wPgo8L2JvZHk+CjwvaHRtbD4KYGBgCgotIGA8IURPQ1RZUEUgaHRtbD5gID0gc3BlYWsgbW9kZXJuIEhUTUwKLSBgPGhlYWQ+YCA9IGhpZGRlbiBpbmZvLCB0aXRsZSBzaG93biBpbiBicm93c2VyIHRhYgotIGA8Ym9keT5gID0gd2hhdCBwZW9wbGUgc2VlCgpZb3UgY2FuIHR5cGUgdGhpcyBpbiBwaG9uZSBOb3RlcGFkLCBvciB3cml0ZSBvbiBwYXBlciB0byBsZWFybiBzdHJ1Y3R1cmUuCgojIyMgSG93IHRvIHNlZSBpdAoxLiBQaG9uZTogSW5zdGFsbCBBY29kZSBvciB1c2Ugb25saW5lOiBodG1sLW9ubGluZS5jb20gKG5lZWRzIGRhdGEgb25jZSkKMi4gTm8gZGF0YT8gRHJhdyBib3hlczogbGFiZWwgaGVhZCB2cyBib2R5IG9uIHBhcGVyIC0gY291bnRzIGZvciBEYXkgMS4KMy4gTGFwdG9wOiBTYXZlIGFzIGBpbmRleC5odG1sYCA+IGRvdWJsZS1jbGljayB0byBvcGVuIGluIENocm9tZS4KCiMjIyBFeGVyY2lzZTogc2hhcnBlbiB5b3VyIHBhZ2UKMS4gQ29weSB0aGUgc2tlbGV0b24gYWJvdmUuCjIuIENoYW5nZSB0aXRsZSB0byB5b3VyIG5hbWUgKyBidXNpbmVzcyBlLmcuICJBbWEgLSBCYWtlcnkiCjMuIENoYW5nZSBoMSB0byAiV2VsY29tZSB0byBbWW91ciBTaG9wXSIKNC4gQ2hhbmdlIHBhcmFncmFwaCB0byBvbmUgc2VudGVuY2UgYWJvdXQgS2xhZ29uLgo1LiBTaG93IGEgZnJpZW5kIGFuZCBleHBsYWluIGhlYWQgdnMgYm9keS4KCj4gKipXaHkgaXQgd29ya3MgKHRoZW9yeSBpbiAzIGxpbmVzKToqKiBCcm93c2VyIHJlYWRzIHRvcC1kb3duLCBoZWFkIGZpcnN0IGZvciBzZXR0aW5ncyB0aGVuIGJvZHkgdG8gZHJhdy4gRE9DVFlQRSB0ZWxscyBtb2Rlcm4gbW9kZSwgZWxzZSBxdWlya3MgYnJlYWsgbGF5b3V0LiBoMStwIGdpdmVzIEdvb2dsZSArIHNjcmVlbiByZWFkZXIgdGhlIHNwaW5lIHRvIGFubm91bmNlLgoKIyMjIFN1bW1hcnkKLSBIVE1MID0gbGFiZWxzIGZvciBjb250ZW50LCBub3QgbWFnaWMgY29kZQotIEV2ZXJ5IHBhZ2UgbmVlZHMgaHRtbCwgaGVhZCwgYm9keQotIGgxICsgcCBpcyBlbm91Z2ggZm9yIERheSAxCi0gWW91IGNhbiBzdGFydCBvbiBwYXBlci9waG9uZQoKWysxMCBYUF0=','base64'),'utf8'), 0
from public.courses c where c.title = 'Build Your First Web Page'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 0
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Build Your First Web Page' and l.sort_order = 0
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'What does HTML do?', '["Labels content","Hacks phones","Makes internet"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Where does visible content go?', '["head","body","doctype"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Page shows blank, code has `<body><h1>Hi` with no closing. Fix?', '["add `</h1></body></html>`","add more h1","delete head"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Title shows "Untitled", customer can''t find shop. Fix?', '["set `<title>Ama Bakery Klagon</title>` in head","make h1 bigger","add image"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 0

-- Build Your First Web Page :: lesson 1 — Text That Talks: Headings, Paragraphs and Lists (11 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Text That Talks: Headings, Paragraphs and Lists', 11, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIGZvcm1hdCB0ZXh0IGxpa2UgYSByZWFsIHNob3Agc2lnbjogaGVhZGluZ3MsIHBhcmFncmFwaHMsIGJvbGQsIGFuZCBsaXN0cy4KCiMjIyBIZWFkaW5ncyBhcmUgaGllcmFyY2h5LCBub3Qgc2l6ZQpgYGBodG1sCjxoMT5LbGFnb24gQ29tbXVuaXR5IEJha2VyeTwvaDE+CjxoMj5GcmVzaCBEYWlseSBCcmVhZDwvaDI+CjxoMz4gT3BlbmluZyBIb3VyczwvaDM+CjxwPldlIGJha2UgZXZlcnkgbW9ybmluZyBhdCA1YW0gaW4gS2xhZ29uLjwvcD4KYGBgClVzZSBPTkUgaDEgcGVyIHBhZ2UuIGgyIGZvciBzZWN0aW9ucywgaDMgZm9yIHN1Yi1zZWN0aW9ucy4KCiMjIyBNYWtlIHdvcmRzIHN0YW5kIG91dApgYGBodG1sCjxwPkZyZXNoIDxzdHJvbmc+dGVhIGJyZWFkPC9zdHJvbmc+IGZvciA8ZW0+NSBjZWRpczwvZW0+LjwvcD4KPHA+V2F0ZXIgaXMgSDxzdWI+Mjwvc3ViPk8sIGRpc2NvdW50IGlzIDEwPHN1cD4lPC9zdXA+IG9mZi48L3A+CjxwPkJlc3Qgc2VsbGVyOjxicj5TdWdhciBicmVhZCAtIHNvZnQgaW5zaWRlPC9wPgpgYGAKLSBgPHN0cm9uZz5gID0gaW1wb3J0YW50IChib2xkKSwgYDxlbT5gID0gc3RyZXNzIChpdGFsaWMpCi0gYDxicj5gID0gbGluZSBicmVhaywgbm8gY2xvc2luZyBuZWVkZWQKLSBgPGhyPmAgPSBob3Jpem9udGFsIGxpbmUgdG8gc2VwYXJhdGUgc2VjdGlvbnMKCiMjIyBMaXN0cyBzZWxsCmBgYGh0bWwKPGgyPk1lbnU8L2gyPgo8dWw+CiAgPGxpPlN1Z2FyIGJyZWFkIC0gNSBjZWRpczwvbGk+CiAgPGxpPlRlYSBicmVhZCAtIDcgY2VkaXM8L2xpPgogIDxsaT5XaGVhdCBicmVhZCAtIDEwIGNlZGlzPC9saT4KPC91bD4KCjxoMj5Ib3cgdG8gT3JkZXI8L2gyPgo8b2w+CiAgPGxpPldoYXRzQXBwIDAyNCAzMjYgMjAxOTwvbGk+CiAgPGxpPlRlbGwgdXMgcXVhbnRpdHk8L2xpPgogIDxsaT5QaWNrIHVwIGF0IDdhbTwvbGk+Cjwvb2w+CmBgYAotIGA8dWw+YCA9IHVub3JkZXJlZCAoZG90cyksIGA8b2w+YCA9IG9yZGVyZWQgKG51bWJlcnMpLCBgPGxpPmAgPSBpdGVtCgojIyMgRXhlcmNpc2UKMS4gTWFrZSBhIG1lbnUgd2l0aCA0IGl0ZW1zICsgcHJpY2VzIGluIGNlZGlzIHVzaW5nIHVsLgoyLiBNYWtlIDMtc3RlcCBvcmRlciBzdGVwcyB1c2luZyBvbC4KMy4gQWRkIG9uZSBwYXJhZ3JhcGggd2l0aCBzdHJvbmcgKyBlbS4KNC4gQWRkIGhyIGJldHdlZW4gbWVudSBhbmQgc3RlcHMuCgo+ICoqV2h5IGl0IHdvcmtzICh0aGVvcnkgaW4gMyBsaW5lcyk6KiogaDEgb25jZSB0ZWxscyBHb29nbGUgbWFpbiB0b3BpYywgbXVsdGlwbGUgaDEgY29uZnVzZXMgcmFuay4gc3Ryb25nL2VtIGNhcnJ5IG1lYW5pbmcgZm9yIHNjcmVlbiByZWFkZXJzLCBub3QganVzdCBib2xkLiB1bCA9IHVub3JkZXJlZCBjaG9pY2VzLCBvbCA9IHNlcXVlbmNlIHdoZXJlIG9yZGVyIG1hdHRlcnMgZm9yIHJlY2lwZS9vcmRlci4KCiMjIyBTdW1tYXJ5Ci0gaDEgb25jZSwgaDIvaDMgZm9yIHN0cnVjdHVyZQotIHN0cm9uZy9lbSBmb3IgbWVhbmluZywgbm90IGp1c3QgbG9va3MKLSB1bCBmb3IgbWVudSwgb2wgZm9yIHN0ZXBzCi0gYnIvaHIgYXJlIHNlbGYtY2xvc2luZyBoZWxwZXJzCgpbKzEwIFhQXQ==','base64'),'utf8'), 1
from public.courses c where c.title = 'Build Your First Web Page'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 1
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Build Your First Web Page' and l.sort_order = 1
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'How many h1 per page?', '["1","5","10"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Which list for steps?', '["ul","ol","li alone"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Menu shows numbers 1,2,3 but items have no order. Fix?', '["change ol to ul with li","add more h1","delete li"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Screen reader skips importance, code uses `<b>pay now</b>`. Fix?', '["use `<strong>pay now</strong>` for meaning","make bigger","add br"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 1

-- Build Your First Web Page :: lesson 2 — Click Here: Links, Images and Your Bakery Page (12 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Click Here: Links, Images and Your Bakery Page', 12, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIGNvbm5lY3QgcGFnZXMgYW5kIHNob3cgcGhvdG9zIC0gdGhlIGhlYXJ0IG9mIGEgYnVzaW5lc3Mgc2l0ZS4KCiMjIyBMaW5rcyBjb25uZWN0IEtsYWdvbiB0byB0aGUgd29ybGQKYGBgaHRtbAo8YSBocmVmPSJodHRwczovL2tsYWdvbi5vcmciPlZpc2l0IEtMQUdPTi5vcmc8L2E+CjxhIGhyZWY9Imh0dHBzOi8vd2EubWUvMjMzMjQzMjYyMDE5Ij5PcmRlciBvbiBXaGF0c0FwcDwvYT4KPGEgaHJlZj0ibWVudS5odG1sIj5TZWUgT3VyIE1lbnU8L2E+CmBgYAo+ICoqUnVsZToqKiBgaHJlZmAgaXMgZGVzdGluYXRpb24uIFRleHQgYmV0d2VlbiB0YWdzIGlzIHdoYXQgcGVvcGxlIGNsaWNrLgoKT3BlbiBXaGF0c0FwcCBpbiBuZXcgdGFiOgpgYGBodG1sCjxhIGhyZWY9Imh0dHBzOi8vd2EubWUvMjMzMjQzMjYyMDE5IiB0YXJnZXQ9Il9ibGFuayI+Q2hhdCBOb3c8L2E+CmBgYAoKIyMjIEltYWdlcyBzZWxsIGJyZWFkCmBgYGh0bWwKPGltZyBzcmM9ImJha2VyeS5qcGciIGFsdD0iRnJlc2ggdGVhIGJyZWFkIGF0IEtsYWdvbiBCYWtlcnkiIHdpZHRoPSIzMDAiPgpgYGAKLSBgc3JjYCA9IGZpbGUgbmFtZSwgYGFsdGAgPSBkZXNjcmlwdGlvbiBpZiBwaG90byBmYWlscyArIGZvciBibGluZCB1c2VycyArIEdvb2dsZS4gQWx3YXlzIHdyaXRlIGFsdC4KLSBTYXZlIGltYWdlIGluIHNhbWUgZm9sZGVyIGFzIGluZGV4Lmh0bWwuCgpGb2xkZXIgcnVsZToKYGBgCm15LXNpdGUvCiAgaW5kZXguaHRtbAogIGJha2VyeS5qcGcKYGBgCgojIyMgUHV0IGl0IHRvZ2V0aGVyCmBgYGh0bWwKPGgxPktsYWdvbiBDb21tdW5pdHkgQmFrZXJ5PC9oMT4KPHA+RnJlc2ggZGFpbHkgYnJlYWQsIG1hZGUgYnkgS2xhZ29uIGhhbmRzLjwvcD4KPGltZyBzcmM9ImJha2VyeS5qcGciIGFsdD0iRnJlc2ggYnJlYWQiIHdpZHRoPSIzMDAiPgo8cD48YSBocmVmPSJodHRwczovL3dhLm1lLzIzMzI0MzI2MjAxOSI+T3JkZXIgb24gV2hhdHNBcHA8L2E+PC9wPgpgYGAKCiMjIyBFeGVyY2lzZQoxLiBBZGQgMSBpbWFnZSB3aXRoIGdvb2QgYWx0IChlLmcuICJBZnJhbSBQbGFpbnMgc2l0ZSIpLgoyLiBBZGQgMiBsaW5rczogb25lIFdoYXRzQXBwLCBvbmUga2xhZ29uLm9yZy4KMy4gVGVzdDogY2xpY2sgYm90aCAtIGRvIHRoZXkgZ28gcmlnaHQgcGxhY2U/CjQuIE5vIHBob3RvPyBVc2UgcGxhY2Vob2xkZXI6IGBodHRwczovL3ZpYS5wbGFjZWhvbGRlci5jb20vMzAwYCBhcyBzcmMgdG8gcHJhY3RpY2UuCgo+ICoqV2h5IGl0IHdvcmtzICh0aGVvcnkgaW4gMyBsaW5lcyk6KiogaHJlZiBob2xkcyBkZXN0aW5hdGlvbiwgYnJvd3NlciBmZXRjaGVzIGl0OyBicm9rZW4gaHJlZiA9IDQwNCBsb3N0IHNhbGUuIGFsdCBzaG93cyB3aGVuIGltYWdlIGZhaWxzICsgdGVsbHMgYmxpbmQgKyBHb29nbGUsIGVtcHR5IGFsdCBoaWRlcy4gU2FtZS1mb2xkZXIgc3JjIHJlc29sdmVzIGZhc3Qgd2l0aG91dCBkYXRhIGZvciBsb2NhbCBmaWxlLgoKIyMjIFN1bW1hcnkKLSBhICsgaHJlZiA9IGxpbmssIGltZyArIHNyYyArIGFsdCA9IHBob3RvCi0gYWx0IGlzIHJlcXVpcmVkIGZvciBhY2Nlc3MgKyBTRU8KLSBLZWVwIGltYWdlcyArIGh0bWwgaW4gc2FtZSBmb2xkZXIKLSBXaGF0c0FwcCBsaW5rID0geW91ciBjaGVja291dCBmb3Igbm93CgpbKzEwIFhQXQ==','base64'),'utf8'), 2
from public.courses c where c.title = 'Build Your First Web Page'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 2
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Build Your First Web Page' and l.sort_order = 2
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Which attribute for link destination?', '["src","href","alt"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Why alt?', '["decoration","accessibility + SEO","make bigger"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Image shows broken icon, code `<img src="bakery.jpg">` but file in photos/. Fix?', '["move to same folder or use `photos/bakery.jpg` + add alt","delete img","add href"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Link `<a>click here</a>` with no href goes nowhere. Fix?', '["add `href=\"https://wa.me/233243262019\"` + clear text","make bold","add image"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 2

-- Build Your First Web Page :: lesson 3 — Project - My Klagon Business Card Page + Quiz (12 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Project - My Klagon Business Card Page + Quiz', 12, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIGJ1aWxkIGFuZCBjaGVjayBhIGNvbXBsZXRlIDEtcGFnZSBzaXRlIHJlYWR5IGZvciBDb3Vyc2UgMi4KCiMjIyBGaW5hbCBjb2RlIHRvIGJlYXQKYGBgaHRtbAo8IURPQ1RZUEUgaHRtbD4KPGh0bWw+CjxoZWFkPgogIDx0aXRsZT5BbWEgLSBLbGFnb24gQmFrZXJ5PC90aXRsZT4KPC9oZWFkPgo8Ym9keT4KICA8aDE+QW1hJ3MgQmFrZXJ5IC0gS2xhZ29uPC9oMT4KICA8cD5GcmVzaCBkYWlseSBicmVhZCBmcm9tIDVhbS4gQ2FsbCA8c3Ryb25nPjAyNCAzMjYgMjAxOTwvc3Ryb25nPi48L3A+CgogIDxoMj5NZW51PC9oMj4KICA8dWw+CiAgICA8bGk+U3VnYXIgYnJlYWQgLSA1IGNlZGlzPC9saT4KICAgIDxsaT5UZWEgYnJlYWQgLSA3IGNlZGlzPC9saT4KICAgIDxsaT5XaGVhdCBicmVhZCAtIDEwIGNlZGlzPC9saT4KICA8L3VsPgoKICA8aW1nIHNyYz0iYmFrZXJ5LmpwZyIgYWx0PSJGcmVzaCBicmVhZCBhdCBBbWEncyBCYWtlcnkiIHdpZHRoPSIzMDAiPgoKICA8aDI+T3JkZXI8L2gyPgogIDxvbD4KICAgIDxsaT5XaGF0c0FwcCB1czwvbGk+CiAgICA8bGk+VGVsbCBxdWFudGl0eTwvbGk+CiAgICA8bGk+UGljayB1cCA3YW08L2xpPgogIDwvb2w+CiAgPHA+PGEgaHJlZj0iaHR0cHM6Ly93YS5tZS8yMzMyNDMyNjIwMTkiPk9yZGVyIG9uIFdoYXRzQXBwPC9hPjwvcD4KICA8aHI+CiAgPHA+TWFkZSBpbiBLbGFnb24sIEdoYW5hPC9wPgo8L2JvZHk+CjwvaHRtbD4KYGBgCgojIyMgQ2hlY2tsaXN0IChtdXN0IHBhc3MgYWxsKQotIFsgXSBET0NUWVBFICsgaHRtbCArIGhlYWQgKyBib2R5IHByZXNlbnQKLSBbIF0gMSBoMSBvbmx5Ci0gWyBdIHVsIG1lbnUgKyBvbCBzdGVwcwotIFsgXSBpbWcgd2l0aCBhbHQKLSBbIF0gV2hhdHNBcHAgbGluayB3b3JrcwotIFsgXSBUaXRsZSB0YWcgaGFzIHlvdXIgbmFtZQoKIyMjIEV4ZXJjaXNlOiBzaGlwIGl0CjEuIEJ1aWxkIHlvdXIgdmVyc2lvbiBmb3IgcmVhbCBvciBpbWFnaW5lZCBidXNpbmVzcyAoYmFyYmVyLCBwcm92aXNpb25zLCB0YWlsb3JpbmcpLgoyLiBBc2sgMSBwZXJzb24gdG8gcmVhZCBhbmQgb3JkZXIgLSBjYW4gdGhleSBpbiAzMCBzZWM/CjMuIEZpeCB3aGF0IGNvbmZ1c2VkIHRoZW0uCjQuIFNhdmUgZmlsZSAtIHlvdSB3aWxsIHVwZ3JhZGUgaXQgaW4gSW50ZXJtZWRpYXRlLgoKIyMjIFN1bW1hcnkKLSBZb3Ugbm93IG93biBCYXNpYyBIVE1MOiBza2VsZXRvbiwgdGV4dCwgbGlzdHMsIGxpbmtzLCBpbWFnZXMKLSBOZXh0OiB0YWJsZXMsIG1lZGlhLCBmb3JtcyB0byB0YWtlIG9yZGVycwoKPiAqKldoeSBpdCB3b3JrcyAodGhlb3J5IGluIDMgbGluZXMpOioqIENvbXBsZXRlIHNrZWxldG9uICsgMSBoMSArIGxpc3RzICsgYWx0ICsgd29ya2luZyBsaW5rID0gcGFyc2FibGUsIGZpbmRhYmxlLCB1c2FibGUuIFZhbGlkYXRvciBjaGVja3MgbmVzdGluZywgYnJvd3NlciBmb3JnaXZlcyBidXQgR29vZ2xlIGRvZXNuJ3QuIDMwLXNlYyBvcmRlciB0ZXN0IHByb3ZlcyBqb2ItcmVhZHksIG5vdCBqdXN0IGNvZGUtY29ycmVjdC4KClsrMTAgWFAgKyBCYWRnZTogSFRNTCBTdGFydGVyXQ==','base64'),'utf8'), 3
from public.courses c where c.title = 'Build Your First Web Page'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, 'HTML Starter'
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 3
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Build Your First Web Page' and l.sort_order = 3
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Skeleton order?', '["html>head>body","body>head>html","head>html>body"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Visible content tag?', '["head","title","body"]'::jsonb, 2
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Page has 3 h1 + img with alt="pic" + link "click here". Best fix first?', '["keep 1 h1 + alt=\"Fresh tea bread at Klagon Bakery\" + link \"Order on WhatsApp\"","add more h1","delete all"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Customer can''t order in 30 sec, menu is paragraph not list. Fix?', '["convert to ul menu + ol steps + WhatsApp button","add colour","add 5 photos"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Build Your First Web Page' and l.sort_order = 3

-- ================= Forms, Photos & Tables =================
insert into public.courses (title, category, icon, description, published)
select 'Forms, Photos & Tables', 'Future Skills', '📝', 'Collect orders, show photos and videos, and organize with tables.', true
where not exists (select 1 from public.courses where title = 'Forms, Photos & Tables');

update public.courses c set prerequisite_course_id = p.id
from public.courses p
where c.title = 'Forms, Photos & Tables' and p.title = 'Build Your First Web Page'
  and c.prerequisite_course_id is distinct from p.id;

-- Forms, Photos & Tables :: lesson 0 — Show It Well: Images, Audio, Video Like a Pro (11 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Show It Well: Images, Audio, Video Like a Pro', 11, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIGVtYmVkIG1lZGlhIHRoYXQgbG9hZHMgZmFzdCBvbiBHaGFuYSBkYXRhIC0gYW5kIHN0aWxsIGxvb2tzIHByby4KCiMjIyBJbWFnZXMgdGhhdCBkb24ndCBjaG9wIGRhdGEKYGBgaHRtbAo8aW1nIHNyYz0iYnJlYWQtc21hbGwuanBnIiBhbHQ9IlN1Z2FyIGJyZWFkIGNsb3NlLXVwIiB3aWR0aD0iMTAwJSI+CjxwPjxzbWFsbD5QaG90bzogQW1hJ3MgQmFrZXJ5LCBLbGFnb24gLSA3YW0gYmF0Y2g8L3NtYWxsPjwvcD4KYGBgClRpcHM6Ci0gVXNlIHdpZHRoPSIxMDAlIiBmb3IgbW9iaWxlLWZyaWVuZGx5LCBub3QgZml4ZWQgODAwcHguCi0gS2VlcCBmaWxlIDwyMDBLQjogY29tcHJlc3Mgb24gcGhvbmUgd2l0aCBQaG90byBDb21wcmVzcyBhcHAuCi0gMyBpbWFnZXMgbWF4IHBlciBwYWdlIGZvciBzbG93IG5ldHdvcmtzLgoKRmlndXJlICsgY2FwdGlvbiAocHJvIHdheSk6CmBgYGh0bWwKPGZpZ3VyZT4KICA8aW1nIHNyYz0ic2hvcC5qcGciIGFsdD0iS2xhZ29uIENvbW11bml0eSBCYWtlcnkgZnJvbnQiIHdpZHRoPSIxMDAlIj4KICA8ZmlnY2FwdGlvbj5PdXIgc2hvcCBuZWFyIFNha3Vtb25vIGp1bmN0aW9uPC9maWdjYXB0aW9uPgo8L2ZpZ3VyZT4KYGBgCgojIyMgQXVkaW8gKyBWaWRlbyAobm8gWW91VHViZSBuZWVkZWQpCmBgYGh0bWwKPHZpZGVvIHNyYz0iYmFraW5nLm1wNCIgY29udHJvbHMgd2lkdGg9IjEwMCUiPjwvdmlkZW8+CjxhdWRpbyBzcmM9ImppbmdsZS5tcDMiIGNvbnRyb2xzPjwvYXVkaW8+CmBgYAotIEFsd2F5cyBgY29udHJvbHNgIG9yIHVzZXJzIGNhbid0IHBsYXkuCi0gQWRkIHRleHQgZmFsbGJhY2s6IGA8cD5WaWRlbzogaG93IHdlIGJha2UgYXQgNWFtPC9wPmAKCllvdVR1YmUgZW1iZWQgKG5lZWRzIGRhdGEpOgpgYGBodG1sCjxpZnJhbWUgd2lkdGg9IjEwMCUiIGhlaWdodD0iMjE1IiBzcmM9Imh0dHBzOi8vd3d3LnlvdXR1YmUuY29tL2VtYmVkL1ZJREVPX0lEIiB0aXRsZT0iQmFrZXJ5IHZpZGVvIj48L2lmcmFtZT4KYGBgCgojIyMgRXhlcmNpc2UKMS4gQWRkIDEgZmlndXJlICsgZmlnY2FwdGlvbiB0byB5b3VyIEJha2VyeSBwYWdlLgoyLiBBZGQgMSB2aWRlbyBPUiBhdWRpbyB3aXRoIGNvbnRyb2xzICsgZGVzY3JpcHRpb24uCjMuIFRlc3Qgb24gcGhvbmUgZGF0YTogZG9lcyBwYWdlIGxvYWQgaW4gPDEwIHNlYz8gSWYgbm90LCByZW1vdmUgMSBpbWFnZS4KCj4gKipXaHkgaXQgd29ya3MgKHRoZW9yeSBpbiAzIGxpbmVzKToqKiBmaWd1cmUgZ3JvdXBzIGltYWdlICsgY2FwdGlvbiBhcyBvbmUgdW5pdCBmb3IgcmVhZGVycy4gY29udHJvbHMgaGFuZHMgcGxheSB0byB1c2VyLCBubyBhdXRvcGxheSBkYXRhIHRoZWZ0LiB3aWR0aCAxMDAlIHNjYWxlcyB0byBwaG9uZSwgZml4ZWQgcHggb3ZlcmZsb3dzIGFuZCBjaG9wcy4KCiMjIyBTdW1tYXJ5Ci0gZmlndXJlL2ZpZ2NhcHRpb24gPSBwcm8gcGhvdG8gYmxvY2sKLSBjb250cm9scyByZXF1aXJlZCBmb3IgYXVkaW8vdmlkZW8KLSBNb2JpbGUtZmlyc3Q6IHdpZHRoIDEwMCUsIHNtYWxsIGZpbGVzCgpbKzEwIFhQXQ==','base64'),'utf8'), 0
from public.courses c where c.title = 'Forms, Photos & Tables'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 0
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Forms, Photos & Tables' and l.sort_order = 0
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Pro photo block?', '["img alone","figure+figcaption","div"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Why controls?', '["decoration","lets user play","SEO"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Video shows but no play button, code `<video src="baking.mp4">`. Fix?', '["add `controls` + width 100%","add more src","delete video"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Page 8MB with 6 raw photos, loads 40 sec on data. Fix?', '["compress to <200KB each, max 3, width 100%","add more photos","use 800px fixed"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 0

-- Forms, Photos & Tables :: lesson 1 — Tables: Prices and Opening Hours (11 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Tables: Prices and Opening Hours', 11, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIGJ1aWxkIGNsZWFuIHByaWNlIHRhYmxlcyBjdXN0b21lcnMgY2FuIHNjYW4gaW4gc2Vjb25kcy4KCiMjIyBTaW1wbGUgcHJpY2UgdGFibGUKYGBgaHRtbAo8dGFibGUgYm9yZGVyPSIxIj4KICA8dHI+CiAgICA8dGg+QnJlYWQ8L3RoPgogICAgPHRoPlByaWNlPC90aD4KICA8L3RyPgogIDx0cj4KICAgIDx0ZD5TdWdhciBicmVhZDwvdGQ+CiAgICA8dGQ+NSBjZWRpczwvdGQ+CiAgPC90cj4KICA8dHI+CiAgICA8dGQ+VGVhIGJyZWFkPC90ZD4KICAgIDx0ZD43IGNlZGlzPC90ZD4KICA8L3RyPgo8L3RhYmxlPgpgYGAKLSBgPHRhYmxlPmAgPSB3aG9sZSwgYDx0cj5gID0gcm93LCBgPHRoPmAgPSBoZWFkZXIgKGJvbGQpLCBgPHRkPmAgPSBkYXRhLgoKIyMjIFBybyBob3VycyB0YWJsZQpgYGBodG1sCjx0YWJsZSBib3JkZXI9IjEiPgogIDxjYXB0aW9uPk9wZW5pbmcgSG91cnMgLSBLbGFnb24gQmFrZXJ5PC9jYXB0aW9uPgogIDx0cj48dGg+RGF5PC90aD48dGg+SG91cnM8L3RoPjwvdHI+CiAgPHRyPjx0ZD5Nb24gLSBTYXQ8L3RkPjx0ZD42YW0gLSA4cG08L3RkPjwvdHI+CiAgPHRyPjx0ZD5TdW5kYXk8L3RkPjx0ZD43YW0gLSAycG08L3RkPjwvdHI+CjwvdGFibGU+CmBgYApgPGNhcHRpb24+YCA9IHRpdGxlIGZvciB0YWJsZSwgaGVscHMgc2NyZWVuIHJlYWRlcnMuCgojIyMgRXhlcmNpc2UKMS4gQ29udmVydCB5b3VyIHVsIG1lbnUgaW50byBhIDMtcm93IHByaWNlIHRhYmxlLgoyLiBBZGQgY2FwdGlvbiArIGhlYWRlciByb3cuCjMuIEFkZCBzZWNvbmQgdGFibGUgZm9yIGhvdXJzLgoKPiAqKldoeSBpdCB3b3JrcyAodGhlb3J5IGluIDMgbGluZXMpOioqIHRoIG1hcmtzIGhlYWRlciBmb3Igc2NyZWVuIHJlYWRlciArIGJvbGQsIHRkIGlzIGRhdGEuIGNhcHRpb24gdGl0bGVzIHRhYmxlIHNvIGJsaW5kICsgR29vZ2xlIGtub3cgcHVycG9zZS4gVGFibGVzIGFyZSBmb3IgZGF0YSByZWxhdGlvbnMsIG5vdCBsYXlvdXQgLSBsYXlvdXQgdGFibGVzIGJyZWFrIG1vYmlsZS4KCiMjIyBTdW1tYXJ5Ci0gdGggZm9yIGhlYWRlcnMsIHRkIGZvciBkYXRhLCB0ciBmb3Igcm93cwotIGNhcHRpb24gZGVzY3JpYmVzIHRhYmxlCi0gVGFibGVzIGZvciBkYXRhIG9ubHksIG5vdCBwYWdlIGxheW91dCAoQWR2YW5jZWQgY292ZXJzIGxheW91dCkKClsrMTAgWFBd','base64'),'utf8'), 1
from public.courses c where c.title = 'Forms, Photos & Tables'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 1
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Forms, Photos & Tables' and l.sort_order = 1
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Header cell?', '["td","th","tr"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Row tag?', '["tr","table","caption"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Prices show but screen reader reads no headers, code uses all td. Fix?', '["change first row td to th + add caption","add more rows","add border"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Table used for whole page layout breaks on phone. Fix?', '["use table only for prices/hours, layout via sections (Advanced)","add more tables","delete caption"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 1

-- Forms, Photos & Tables :: lesson 2 — Forms Part 1: Order Form for Bakery (12 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Forms Part 1: Order Form for Bakery', 12, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIGNvbGxlY3QgbmFtZSwgcGhvbmUsIGJyZWFkIHR5cGUgYW5kIHF1YW50aXR5LgoKIyMjIEJhc2ljIG9yZGVyIGZvcm0KYGBgaHRtbAo8Zm9ybSBhY3Rpb249IiMiIG1ldGhvZD0icG9zdCI+CiAgPGxhYmVsIGZvcj0ibmFtZSI+WW91ciBOYW1lOjwvbGFiZWw+PGJyPgogIDxpbnB1dCB0eXBlPSJ0ZXh0IiBpZD0ibmFtZSIgbmFtZT0ibmFtZSIgcGxhY2Vob2xkZXI9ImUuZy4gS3dhbWUiIHJlcXVpcmVkPjxicj48YnI+CgogIDxsYWJlbCBmb3I9InBob25lIj5QaG9uZSAvIFdoYXRzQXBwOjwvbGFiZWw+PGJyPgogIDxpbnB1dCB0eXBlPSJ0ZWwiIGlkPSJwaG9uZSIgbmFtZT0icGhvbmUiIHBsYWNlaG9sZGVyPSIwMjQgWFhYIFhYWFgiIHJlcXVpcmVkPjxicj48YnI+CgogIDxsYWJlbCBmb3I9ImJyZWFkIj5DaG9vc2UgQnJlYWQ6PC9sYWJlbD48YnI+CiAgPHNlbGVjdCBpZD0iYnJlYWQiIG5hbWU9ImJyZWFkIj4KICAgIDxvcHRpb24+U3VnYXIgYnJlYWQgLSA1IGNlZGlzPC9vcHRpb24+CiAgICA8b3B0aW9uPlRlYSBicmVhZCAtIDcgY2VkaXM8L29wdGlvbj4KICAgIDxvcHRpb24+V2hlYXQgYnJlYWQgLSAxMCBjZWRpczwvb3B0aW9uPgogIDwvc2VsZWN0Pjxicj48YnI+CgogIDxsYWJlbCBmb3I9InF0eSI+UXVhbnRpdHk6PC9sYWJlbD48YnI+CiAgPGlucHV0IHR5cGU9Im51bWJlciIgaWQ9InF0eSIgbmFtZT0icXR5IiBtaW49IjEiIG1heD0iNTAiIHZhbHVlPSIyIj48YnI+PGJyPgoKICA8YnV0dG9uIHR5cGU9InN1Ym1pdCI+U2VuZCBPcmRlcjwvYnV0dG9uPgo8L2Zvcm0+CmBgYAo+ICoqUnVsZToqKiBsYWJlbCBgZm9yYCBtdXN0IG1hdGNoIGlucHV0IGBpZGAuIFRoYXQgbWFrZXMgY2xpY2sgb24gdGV4dCBmb2N1cyBib3ggLSBjcml0aWNhbCBvbiBwaG9uZS4KCklucHV0IHR5cGVzIHRvIGtub3c6Ci0gdGV4dCwgdGVsLCBudW1iZXIsIGVtYWlsLCBkYXRlLCBwYXNzd29yZAoKIyMjIEV4ZXJjaXNlCjEuIEFkZCBmb3JtIHRvIHlvdXIgcGFnZSBiZWxvdyBtZW51LgoyLiBUZXN0OiBjbGljayBsYWJlbCAtIGRvZXMgY3Vyc29yIGp1bXA/IElmIG5vdCwgZml4IGZvci9pZC4KMy4gVHJ5IHN1Ym1pdCBlbXB0eSAtIGRvZXMgYHJlcXVpcmVkYCBibG9jaz8gR29vZC4KCj4gKipXaHkgaXQgd29ya3MgKHRoZW9yeSBpbiAzIGxpbmVzKToqKiBsYWJlbCBmb3I9aWQgbGlua3MgdGV4dCB0byBib3ggZm9yIGZhdCBmaW5nZXJzICsgcmVhZGVycy4gcmVxdWlyZWQgYmxvY2tzIGVtcHR5IHN1Ym1pdCBmcmVlLCBubyBKUy4gQ29ycmVjdCB0eXBlICh0ZWwvbnVtYmVyL2VtYWlsKSBicmluZ3MgcmlnaHQgcGhvbmUga2V5Ym9hcmQuCgojIyMgU3VtbWFyeQotIGZvcm0gd3JhcHMgYWxsLCBsYWJlbCtpbnB1dCBwYWlycwotIHJlcXVpcmVkID0gZnJlZSB2YWxpZGF0aW9uCi0gc2VsZWN0IGZvciBjaG9pY2VzLCBudW1iZXIgZm9yIHF0eQoKWysxMCBYUF0=','base64'),'utf8'), 2
from public.courses c where c.title = 'Forms, Photos & Tables'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 2
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Forms, Photos & Tables' and l.sort_order = 2
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'label for must match?', '["name","id","type"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Blocks empty submit?', '["placeholder","required","value"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Click "Phone" does nothing, code `<label>Phone</label><input id="phone">`. Fix?', '["add `for=\"phone\"` to label","add more inputs","delete label"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Qty accepts "plenty" text, total breaks. Fix?', '["use `type=\"number\" min=1 max=50` + required","use text","remove form"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 2

-- Forms, Photos & Tables :: lesson 3 — Forms Part 2 + Project: Contact & Booking Form (12 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Forms Part 2 + Project: Contact & Booking Form', 12, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIGZpbmlzaCB3aXRoIHRleHRhcmVhLCByYWRpbywgY2hlY2tib3ggYW5kIHNoaXAgSW50ZXJtZWRpYXRlIHByb2plY3QuCgojIyMgRmVlZGJhY2sgKyBkZWxpdmVyeSBjaG9pY2VzCmBgYGh0bWwKPGxhYmVsIGZvcj0ibXNnIj5Ob3RlcyAoZS5nLiBubyBzdWdhcik6PC9sYWJlbD48YnI+Cjx0ZXh0YXJlYSBpZD0ibXNnIiByb3dzPSIzIiBjb2xzPSIzMCIgcGxhY2Vob2xkZXI9IkFueSBtZXNzYWdlLi4uIj48L3RleHRhcmVhPjxicj48YnI+Cgo8cD5EZWxpdmVyeT88L3A+CjxpbnB1dCB0eXBlPSJyYWRpbyIgaWQ9InBpY2t1cCIgbmFtZT0iZGVsaXZlcnkiIGNoZWNrZWQ+CjxsYWJlbCBmb3I9InBpY2t1cCI+UGlja3VwPC9sYWJlbD4KPGlucHV0IHR5cGU9InJhZGlvIiBpZD0iZGVsaXZlciIgbmFtZT0iZGVsaXZlcnkiPgo8bGFiZWwgZm9yPSJkZWxpdmVyIj5EZWxpdmVyICgrNSBjZWRpcyk8L2xhYmVsPjxicj48YnI+Cgo8aW5wdXQgdHlwZT0iY2hlY2tib3giIGlkPSJ3aGF0c2FwcCIgY2hlY2tlZD4KPGxhYmVsIGZvcj0id2hhdHNhcHAiPlJlcGx5IG1lIG9uIFdoYXRzQXBwPC9sYWJlbD48YnI+PGJyPgpgYGAKCkZ1bGwgcHJvamVjdCBjaGVja2xpc3Q6Ci0gWyBdIE1lZGlhOiAxIGZpZ3VyZSArIDEgdmlkZW8vYXVkaW8KLSBbIF0gVGFibGU6IHByaWNlICsgaG91cnMgd2l0aCBjYXB0aW9uICsgdGgKLSBbIF0gRm9ybTogbmFtZSwgcGhvbmUsIHNlbGVjdCwgcXR5LCB0ZXh0YXJlYSwgcmFkaW8sIGNoZWNrYm94LCBidXR0b24KLSBbIF0gQWxsIGxhYmVscyBsaW5rZWQgKGZvcj1pZCkKLSBbIF0gUGFnZSBsb2FkcyBmYXN0IG9uIHBob25lCgojIyMgRXhlcmNpc2U6IHNoaXAgSW50ZXJtZWRpYXRlCjEuIENvbWJpbmUgYWxsIGludG8gYG9yZGVyLmh0bWxgLgoyLiBMaW5rIGZyb20gaW5kZXg6IGA8YSBocmVmPSJvcmRlci5odG1sIj5PcmRlciBOb3c8L2E+YAozLiBHZXQgMSByZWFsIG9yZGVyIHRlc3QgZnJvbSBmcmllbmQuCjQuIEZpeCBjb25mdXNpb24gcG9pbnRzLgoKPiAqKldoeSBpdCB3b3JrcyAodGhlb3J5IGluIDMgbGluZXMpOioqIHJhZGlvIHNhbWUgbmFtZSA9IG9uZSBjaG9pY2UgZ3JvdXAsIGRpZmZlcmVudCBuYW1lID0gYnJva2VuIG11bHRpLiB0ZXh0YXJlYSBob2xkcyBtdWx0aWxpbmUgdnMgaW5wdXQgc2luZ2xlLiBMaW5rZWQgbGFiZWxzICsgZmFzdCBsb2FkID0gdGh1bWItcmVhZHkgb3JkZXIgaW4gMzAgc2VjLgoKIyMjIFN1bW1hcnkKLSB0ZXh0YXJlYSBmb3IgbWVzc2FnZXMsIHJhZGlvIGZvciBvbmUgY2hvaWNlLCBjaGVja2JveCBmb3IgeWVzL25vCi0gcmFkaW8gZ3JvdXAgc2hhcmVzIHNhbWUgYG5hbWVgCi0gWW91IG5vdyBoYW5kbGUgbWVkaWEgKyBkYXRhICsgb3JkZXJzCgpbKzEwIFhQICsgQmFkZ2U6IEhUTUwgT3JkZXItVGFrZXJd','base64'),'utf8'), 3
from public.courses c where c.title = 'Forms, Photos & Tables'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, 'HTML Order-Taker'
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 3
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Forms, Photos & Tables' and l.sort_order = 3
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Multi-line message?', '["input text","textarea","select"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Label links by?', '["for=id","name=type","href=src"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Delivery radio allows both Pickup + Deliver ticked. Fix?', '["give both `name=\"delivery\"` same","give different names","delete radio"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Form sends empty name, no block. Fix?', '["add `required` + test label click jumps","add placeholder only","add more buttons"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Forms, Photos & Tables' and l.sort_order = 3

-- ================= Publish Pro Site =================
insert into public.courses (title, category, icon, description, published)
select 'Publish Pro Site', 'Future Skills', '🚀', 'Semantic HTML, SEO, accessibility, and publish free on the internet.', true
where not exists (select 1 from public.courses where title = 'Publish Pro Site');

update public.courses c set prerequisite_course_id = p.id
from public.courses p
where c.title = 'Publish Pro Site' and p.title = 'Forms, Photos & Tables'
  and c.prerequisite_course_id is distinct from p.id;

-- Publish Pro Site :: lesson 0 — Pro Structure: header, nav, main, footer (11 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Pro Structure: header, nav, main, footer', 11, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIHJlYnVpbGQgbWVzc3kgZGl2cyBpbnRvIHNlbWFudGljIHN0cnVjdHVyZSBHb29nbGUgYW5kIHNjcmVlbiByZWFkZXJzIGxvdmUuCgojIyMgQmVmb3JlIChiZWdpbm5lcikgdnMgQWZ0ZXIgKHBybykKQmVmb3JlOgpgYGBodG1sCjxkaXY+TXkgQmFrZXJ5PC9kaXY+CjxkaXY+PGEgaHJlZj0iIyI+SG9tZTwvYT48L2Rpdj4KPGRpdj5CcmVhZCB0ZXh0Li4uPC9kaXY+CjxkaXY+Q29weXJpZ2h0PC9kaXY+CmBgYAoKQWZ0ZXI6CmBgYGh0bWwKPGhlYWRlcj4KICA8aDE+S2xhZ29uIENvbW11bml0eSBCYWtlcnk8L2gxPgogIDxuYXY+CiAgICA8YSBocmVmPSJpbmRleC5odG1sIj5Ib21lPC9hPiB8CiAgICA8YSBocmVmPSJvcmRlci5odG1sIj5PcmRlcjwvYT4gfAogICAgPGEgaHJlZj0iYWJvdXQuaHRtbCI+QWJvdXQ8L2E+CiAgPC9uYXY+CjwvaGVhZGVyPgoKPG1haW4+CiAgPHNlY3Rpb24+CiAgICA8aDI+RnJlc2ggRGFpbHk8L2gyPgogICAgPHA+TWFkZSBieSBLbGFnb24gaGFuZHMgZnJvbSA1YW0uPC9wPgogIDwvc2VjdGlvbj4KICA8YXJ0aWNsZT4KICAgIDxoMj5XaHkgb3VyIHRlYSBicmVhZD88L2gyPgogICAgPHA+U29mdCBpbnNpZGUsIGdvbGRlbiBvdXRzaWRlLjwvcD4KICA8L2FydGljbGU+CjwvbWFpbj4KCjxmb290ZXI+CiAgPHA+wqkgMjAyNiBLbGFnb24gQmFrZXJ5IHwgV2hhdHNBcHAgMDI0IDMyNiAyMDE5IHwgPGEgaHJlZj0iI3RvcCI+QmFjayB0byB0b3A8L2E+PC9wPgo8L2Zvb3Rlcj4KYGBgCj4gKipSdWxlOioqIGhlYWRlciA9IHRvcCwgbmF2ID0gbGlua3MsIG1haW4gPSB1bmlxdWUgY29udGVudCAob25jZSBwZXIgcGFnZSksIHNlY3Rpb24gPSB0aGVtZSBncm91cCwgYXJ0aWNsZSA9IHN0YW5kYWxvbmUsIGZvb3RlciA9IGJvdHRvbS4KCiMjIyBNdWx0aS1wYWdlIG5hdiB0aGF0IHdvcmtzClNhbWUgbmF2IG9uIGFsbCAzIHBhZ2VzLiBGb2xkZXI6CmBgYApteS1zaXRlLwogaW5kZXguaHRtbAogb3JkZXIuaHRtbAogYWJvdXQuaHRtbApgYGAKCiMjIyBFeGVyY2lzZQoxLiBXcmFwIHlvdXIgQmFzaWMgcGFnZSBpbiBoZWFkZXIvbmF2L21haW4vZm9vdGVyLgoyLiBTcGxpdCBjb250ZW50IGludG8gMiBzZWN0aW9ucy4KMy4gQWRkIHNhbWUgbmF2IHRvIG9yZGVyLmh0bWwuCgo+ICoqV2h5IGl0IHdvcmtzICh0aGVvcnkgaW4gMyBsaW5lcyk6KiogU2VtYW50aWMgdGFncyB0ZWxsIEdvb2dsZS9yZWFkZXIgcm9sZSwgZGl2IHRlbGxzIG5vdGhpbmcuIE9uZSBtYWluID0gdW5pcXVlIGNvbnRlbnQgc2lnbmFsIGZvciByYW5rLiBTYW1lIG5hdiBldmVyeXdoZXJlIGJ1aWxkcyBzaXRlIGdyYXBoIGZvciBjcmF3bC4KCiMjIyBTdW1tYXJ5Ci0gU2VtYW50aWMgdGFncyBkZXNjcmliZSBtZWFuaW5nLCBkaXYgZGVzY3JpYmVzIG5vdGhpbmcKLSBPbmUgbWFpbiwgb25lIGgxIHBlciBwYWdlCi0gU2FtZSBuYXYgZXZlcnl3aGVyZSA9IHBybwoKWysxMCBYUF0=','base64'),'utf8'), 0
from public.courses c where c.title = 'Publish Pro Site'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 0
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Publish Pro Site' and l.sort_order = 0
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Unique content wrapper?', '["div","main","footer"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'How many main per page?', '["3","1","10"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Site uses 4 divs, Google + reader lost. Fix?', '["change to header/nav/main/footer with 1 h1","add more divs","delete nav"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 0

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Nav differs per page, users lost on order.html. Fix?', '["paste same nav on all 3 pages","remove links","use images only"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 0

-- Publish Pro Site :: lesson 1 — Be Found & Welcomed: SEO Meta + Accessibility (11 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Be Found & Welcomed: SEO Meta + Accessibility', 11, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIG1ha2UgR29vZ2xlIGZpbmQgeW91IGFuZCBldmVyeW9uZSB1c2UgeW91ciBzaXRlLCBpbmNsdWRpbmcgd2l0aCBzY3JlZW4gcmVhZGVyLgoKIyMjIEhlYWQgdGhhdCByYW5rcwpgYGBodG1sCjxoZWFkPgogIDxtZXRhIGNoYXJzZXQ9IlVURi04Ij4KICA8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+CiAgPG1ldGEgbmFtZT0iZGVzY3JpcHRpb24iIGNvbnRlbnQ9IkZyZXNoIHRlYSBicmVhZCBpbiBLbGFnb24sIFRlbWEgLSBmcm9tIDUgY2VkaXMuIE9yZGVyIG9uIFdoYXRzQXBwLiI+CiAgPHRpdGxlPktsYWdvbiBCYWtlcnkgLSBGcmVzaCBCcmVhZCBpbiBUZW1hIHwgT3JkZXIgT25saW5lPC90aXRsZT4KPC9oZWFkPgpgYGAKLSB2aWV3cG9ydCA9IG1vYmlsZS1mcmllbmRseSAocmVxdWlyZWQpCi0gZGVzY3JpcHRpb24gPSBHb29nbGUgc25pcHBldCwgMTIwLTE1MCBjaGFycywgaW5jbHVkZSBwcmljZSArIHBsYWNlCi0gdGl0bGUgPSA1MC02MCBjaGFycywgcGxhY2UgKyBhY3Rpb24KCiMjIyBBY2Nlc3NpYmlsaXR5IGluIDUgY2hlY2tzCmBgYGh0bWwKPGltZyBzcmM9ImJyZWFkLmpwZyIgYWx0PSIuLi4iPiA8IS0tIG5ldmVyIGVtcHR5IGZvciBidXNpbmVzcyAtLT4KPGxhYmVsIGZvcj0icGhvbmUiPlBob25lOjwvbGFiZWw+PGlucHV0IGlkPSJwaG9uZSI+CjxidXR0b24+U2VuZCBPcmRlcjwvYnV0dG9uPiA8IS0tIHJlYWwgYnV0dG9uLCBub3QgZGl2IC0tPgo8aDE+Li4uPC9oMT48aDI+Li4uPC9oMj4gPCEtLSBkb24ndCBza2lwIGgxLT5oMyAtLT4KPGEgaHJlZj0iLi4uIj5PcmRlciBvbiBXaGF0c0FwcDwvYT4gPCEtLSBuZXZlciAiY2xpY2sgaGVyZSIgYWxvbmUgLS0+CmBgYApDb250cmFzdDogZGFyayB0ZXh0IG9uIGxpZ2h0IGJnLiBUZXN0OiBjYW4geW91IHVzZSB3aXRoIGJyaWdodG5lc3MgbG93PwoKTGFuZzoKYGBgaHRtbAo8aHRtbCBsYW5nPSJlbiI+CmBgYAoKIyMjIEV4ZXJjaXNlCjEuIEFkZCBjaGFyc2V0ICsgdmlld3BvcnQgKyBkZXNjcmlwdGlvbiArIGdvb2QgdGl0bGUuCjIuIEZpeCBhbGwgaW1nIGFsdHMgKyBsaW5rIHRleHRzLgozLiBSZWFkIHBhZ2UgYWxvdWQgLSBkb2VzIGhlYWRpbmcgb3JkZXIgbWFrZSBzZW5zZT8KCj4gKipXaHkgaXQgd29ya3MgKHRoZW9yeSBpbiAzIGxpbmVzKToqKiB2aWV3cG9ydCB0ZWxscyBwaG9uZSB3aWR0aCwgbm8gdmlld3BvcnQgPSB0aW55IGRlc2t0b3AuIERlc2NyaXB0aW9uIGJlY29tZXMgR29vZ2xlIHNuaXBwZXQgZm9yIGNsaWNrcy4gTGFuZyArIG9yZGVyICsgYWx0IGxldHMgcmVhZGVyIG5hcnJhdGUgbG9naWNhbGx5LgoKIyMjIFN1bW1hcnkKLSBTRU8gPSB0aXRsZSArIGRlc2NyaXB0aW9uICsgaGVhZGluZ3MgKyBhbHQKLSBBY2Nlc3NpYmlsaXR5ID0gbGFiZWxzLCBhbHQsIG9yZGVyLCBjb250cmFzdAotIHZpZXdwb3J0IG1ldGEgPSBtb2JpbGUgcGFzcwoKWysxMCBYUF0=','base64'),'utf8'), 1
from public.courses c where c.title = 'Publish Pro Site'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 1
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Publish Pro Site' and l.sort_order = 1
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Mobile meta?', '["charset","viewport","description"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Good link text?', '["click here","Order on WhatsApp","link"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Site tiny on phone, must pinch. Code missing viewport. Fix?', '["add `<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">`","add table","add image"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 1

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Reader hears "click here, click here" + alt="pic". Fix?', '["links \"Order/Menu\" + alt \"Fresh tea bread Klagon\"","add more click here","empty all alt"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 1

-- Publish Pro Site :: lesson 2 — Clean Code: Divs, Spans, Classes, IDs + Validation (11 min, 4 quiz Qs, pass 3)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Clean Code: Divs, Spans, Classes, IDs + Validation', 11, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIG9yZ2FuaXplIGNvZGUgZm9yIENTUyBuZXh0IHN0ZXAgYW5kIGNhdGNoIGVycm9ycyBsaWtlIGEgZGV2LgoKIyMjIENsYXNzIHZzIElECmBgYGh0bWwKPHAgY2xhc3M9InByaWNlIj41IGNlZGlzPC9wPgo8cCBjbGFzcz0icHJpY2UiPjcgY2VkaXM8L3A+CjxwIGlkPSJzcGVjaWFsLXRvZGF5Ij5XaGVhdCAtIDEwIGNlZGlzICh0b2RheSBvbmx5KTwvcD4KYGBgCi0gYGNsYXNzYCA9IG1hbnkgaXRlbXMgKHByaWNlcyksIGBpZGAgPSBvbmUgdW5pcXVlICsgYW5jaG9yIGxpbmssIG5vIHNwYWNlcywgbG93ZXJjYXNlLWh5cGhlbnMuCgpTcGFuIGZvciBpbmxpbmU6CmBgYGh0bWwKPHA+T3BlbiA8c3BhbiBjbGFzcz0ib3Blbi1iYWRnZSI+Tk9XPC9zcGFuPiB0aWxsIDhwbTwvcD4KYGBgCgpDb21tZW50czoKYGBgaHRtbAo8IS0tIE5BViBTVEFSVCAtIGNvcHkgdG8gYWxsIHBhZ2VzIC0tPgo8bmF2Pi4uLjwvbmF2Pgo8IS0tIE9SREVSIEZPUk0gLSBjaGVjayBsYWJlbHMgLS0+CmBgYAoKIyMjIFZhbGlkYXRlIGJlZm9yZSBwdWJsaXNoCjEuIEdvIHRvIHZhbGlkYXRvci53My5vcmcsIHBhc3RlIGNvZGUgb3IgdXBsb2FkLgoyLiBGaXg6IHVuY2xvc2VkIHRhZ3MsIGR1cGxpY2F0ZSBpZHMsIG1pc3NpbmcgYWx0LCBiYWQgbmVzdGluZyAoYDxwPjx1bD5gIHdyb25nKS4KMy4gQ29tbW9uIGZhaWw6IGA8aW1nIC4uLj48L2ltZz5gIC0gaW1nIG5lZWRzIG5vIGNsb3NlLgoKIyMjIEV4ZXJjaXNlCjEuIEFkZCAyIGNsYXNzZXMgKyAxIGlkIHRvIHlvdXIgc2l0ZS4KMi4gQWRkIDIgY29tbWVudHMgdG8gZ3VpZGUgZnV0dXJlIHlvdS4KMy4gVmFsaWRhdGUgYW5kIGZpeCB0byAwIGVycm9ycywgc2NyZWVuc2hvdCByZXN1bHQuCgo+ICoqV2h5IGl0IHdvcmtzICh0aGVvcnkgaW4gMyBsaW5lcyk6KiogY2xhc3MgcmV1c2VzIGZvciBtYW55LCBpZCB1bmlxdWUgZm9yIG9uZSArIGFuY2hvci4gVmFsaWRhdG9yIHBhcnNlcyBuZXN0aW5nLCBjYXRjaGVzIHVuY2xvc2VkL2R1cGxpY2F0ZSB0aGF0IGJyb3dzZXJzIGhpZGUgYnV0IGJyZWFrIENTUyBsYXRlci4KCiMjIyBTdW1tYXJ5Ci0gY2xhc3MgPSByZXVzYWJsZSwgaWQgPSB1bmlxdWUKLSBzcGFuID0gaW5saW5lIHN0eWxlIGhvb2ssIGRpdiA9IGJsb2NrIGhvb2sgKHVzZSBzZW1hbnRpYyBmaXJzdCkKLSBWYWxpZGF0ZSA9IHByb2Zlc3Npb25hbCBwcm9vZgoKWysxMCBYUF0=','base64'),'utf8'), 2
from public.courses c where c.title = 'Publish Pro Site'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 3, null
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 2
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Publish Pro Site' and l.sort_order = 2
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Reusable hook?', '["id","class","title"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Unique per page?', '["class","id","p"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Validator "duplicate id price" x3 + `<img></img>`. Fix?', '["change to class=\"price\" + `<img ...>` no close","add more ids","ignore"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 2

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', '`<p><ul><li>bread</li></ul></p>` flagged bad nesting. Fix?', '["close p before ul, siblings not parent","add div","delete list"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 2

-- Publish Pro Site :: lesson 3 — Project - Full 3-Page Site + Publish + Final Exam (14 min, 5 quiz Qs, pass 4)
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Project - Full 3-Page Site + Publish + Final Exam', 14, convert_from(decode('CiMjIyBXaGF0IHlvdSB3aWxsIGxlYXJuCllvdSB3aWxsIHNoaXAgYSBsaXZlIGxpbmsgeW91IGNhbiBwdXQgb24gQ1YsIFdoYXRzQXBwIHN0YXR1cywga2xhZ29uLm9yZyBwcm9maWxlLgoKIyMjIEJ1aWxkIDMgcGFnZXMKLSBpbmRleC5odG1sOiBoZXJvICsgbWVudSB0YWJsZSArIHBob3RvICsgb3JkZXIgYnV0dG9uCi0gb3JkZXIuaHRtbDogZnVsbCBmb3JtIGZyb20gSW50ZXJtZWRpYXRlICsgaG91cnMgdGFibGUKLSBhYm91dC5odG1sOiBzdG9yeSwgbWFwIGxpbmssIGNvbnRhY3QKCkFsbCBzaGFyZSBzYW1lIGhlYWRlci9uYXYvZm9vdGVyICsgaGVhZCBTRU8uCgpFeGFtcGxlIGFib3V0IHNuaXBwZXQ6CmBgYGh0bWwKPG1haW4+CiA8c2VjdGlvbj48aDI+T3VyIFN0b3J5PC9oMj48cD5TdGFydGVkIDIwMjMgaW4gS2xhZ29uIHdpdGggb25lIG92ZW4uLi48L3A+PC9zZWN0aW9uPgogPHNlY3Rpb24+PGgyPkZpbmQgVXM8L2gyPjxwPjxhIGhyZWY9Imh0dHBzOi8vbWFwcy5nb29nbGUuY29tLz9xPUtsYWdvbixUZW1hIj5PcGVuIE1hcDwvYT48L3A+PC9zZWN0aW9uPgo8L21haW4+CmBgYAoKIyMjIFB1Ymxpc2ggZnJlZSBpbiAxNSBtaW4gKHBob25lLWZyaWVuZGx5KQpPcHRpb24gQSAtIE5ldGxpZnkgRHJvcCAoZWFzaWVzdCk6CjEuIFB1dCAzIGh0bWwgKyBpbWFnZXMgaW4gZm9sZGVyIGBteS1zaXRlYAoyLiBHbyB0byBhcHAubmV0bGlmeS5jb20vZHJvcCwgZHJhZyBmb2xkZXIsIGdldCBsaW5rIGBodHRwczovL2FtYWJha2VyeS5uZXRsaWZ5LmFwcGAKMy4gU2hhcmUgb24gV2hhdHNBcHAuCgpPcHRpb24gQiAtIEdpdEh1YiBQYWdlczoKMS4gQ3JlYXRlIGdpdGh1Yi5jb20gYWNjb3VudCwgbmV3IHJlcG8gYG15LWJha2VyeWAsIFVwbG9hZCBmaWxlcywgU2V0dGluZ3MgPiBQYWdlcyA+IERlcGxveSBtYWluLgoyLiBMaW5rOiBgaHR0cHM6Ly95b3VybmFtZS5naXRodWIuaW8vbXktYmFrZXJ5L2AKCk5vIGxhcHRvcD8gVXNlIGZyaWVuZCdzIGxhcHRvcCBvbmNlLCBvciBBY29kZSArIEdpdEh1YiBtb2JpbGUgdG8gdXBsb2FkLgoKIyMjIEZpbmFsIGNoZWNrbGlzdCAoY2VydGlmaWNhdGUgbGV2ZWwpCi0gWyBdIDMgcGFnZXMgbGlua2VkLCBubyBicm9rZW4gbGlua3MKLSBbIF0gVmFsaWRhdG9yIDAgZXJyb3JzCi0gWyBdIFZpZXdwb3J0ICsgZGVzY3JpcHRpb24gKyB0aXRsZSBvbiBhbGwKLSBbIF0gQWxsIGltYWdlcyBoYXZlIGFsdCwgYWxsIGlucHV0cyBoYXZlIGxhYmVscwotIFsgXSBMb2FkcyA8MTBzIG9uIHBob25lIGRhdGEKLSBbIF0gTGl2ZSBVUkwgd29ya3MKCiMjIyBFeGVyY2lzZTogbGF1bmNoCjEuIFB1Ymxpc2gsIHNlbmQgbGluayB0byAyIHBlb3BsZSwgZ2V0IDEgb3JkZXIvbWVzc2FnZS4KMi4gRml4LCByZS11cGxvYWQuCjMuIFdyaXRlIDItc2VudGVuY2UgYmlvOiAiSSBidWlsdCAuLi4gZm9yIC4uLiBWaXNpdCAuLi4iCgo+ICoqV2h5IGl0IHdvcmtzICh0aGVvcnkgaW4gMyBsaW5lcyk6KiogSFRUUFMgZW5jcnlwdHMgKyB0cnVzdCBiYWRnZSwgSFRUUCB3YXJucy4gU21hbGwgYnVuZGxlIGxvYWRzIDwxMHMgb24gM0csIGxhcmdlIGRyb3BzLiBMaXZlIFVSTCArIDAgZXJyb3JzID0gcG9ydGZvbGlvIHByb29mLCBub3Qgc2NyZWVuc2hvdC4KCiMjIyBTdW1tYXJ5Ci0gWW91IGFyZSBub3cgSFRNTCBCdWlsZGVyOiBzdHJ1Y3R1cmUsIFNFTywgYWNjZXNzLCBwdWJsaXNoCi0gTmV4dCB0cmFjayBvbiBrbGFnb24ub3JnOiBDU1MgU3R5bGluZyBvciBQeXRob24KLSBQb3J0Zm9saW86IGxpdmUgVVJMICsgc2NyZWVuc2hvdHMKClsrMTAgWFAgKyBCYWRnZTogSFRNTCBCdWlsZGVyIC0gS2xhZ29uXQ==','base64'),'utf8'), 3
from public.courses c where c.title = 'Publish Pro Site'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

insert into public.quizzes (lesson_id, pass_score, badge_name)
select l.id, 4, 'HTML Builder - Klagon'
from public.lessons l join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 3
on conflict (lesson_id) do update set pass_score = excluded.pass_score, badge_name = excluded.badge_name;

delete from public.quiz_questions where quiz_id in (
  select q.id from public.quizzes q
  join public.lessons l on l.id = q.lesson_id
  join public.courses c on c.id = l.course_id
  where c.title = 'Publish Pro Site' and l.sort_order = 3
);
insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 0, 'recall', 'Semantic top wrapper?', '["div","header","span"]'::jsonb, 1
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 1, 'recall', 'Must for mobile?', '["viewport meta","table","iframe"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 2, 'fix-it', 'Live site has 3 mains + no description + "click here" links. Fix first?', '["1 main + description + clear links","add mains","delete header"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 3, 'fix-it', 'Netlify shows broken images after drag. Fix?', '["keep html+jpg same folder lowercase + re-drag","separate folders random","rename to spaces"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 3

insert into public.quiz_questions (quiz_id, sort_order, kind, stem, options, correct_index)
select q.id, 4, 'recall', 'SEO snippet from?', '["meta description","button","footer only"]'::jsonb, 0
from public.quizzes q join public.lessons l on l.id = q.lesson_id join public.courses c on c.id = l.course_id
where c.title = 'Publish Pro Site' and l.sort_order = 3


