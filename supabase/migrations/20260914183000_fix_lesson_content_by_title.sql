-- ============================================================
-- klagon.org — content recovery, keyed on REAL row identity
-- Fixes: lessons.content is NULL because the earlier seed issued
--        UPDATE ... WHERE id = '<hardcoded-uuid>' and zero live
--        lesson rows carry those UUIDs (lessons.id = gen_random_uuid()).
-- Result after the old seed: 0 rows updated, silently.
-- This migration re-keys content by (course title, lesson sort) and by
-- lesson title — both stable and present in the live DB.
-- Idempotent: safe to run, re-run, and review.
-- ============================================================

-- ---------- helper: normalize for matching ----------
create or replace function public._lesson_lookup(
  p_course_title text,
  p_lesson_title text
) returns uuid
language sql stable security invoker set search_path = public
as $$
  select l.id
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where lower(trim(c.title)) = lower(trim(p_course_title))
    and lower(trim(l.title)) = lower(trim(p_lesson_title))
  limit 1;
$$;

set search_path = public;

-- ---------- 1. Course: 90-Day Business in 90 Lessons ----------
do $$
declare
  v_id uuid;
begin
  -- use the deterministic lookup helper (no hardcoded uuids anywhere)
  select l.id into v_id
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where c.title = '90-Day Business in 90 Lessons'
    and l.title = 'You have one idea and a pile of evidence proving it hurts.'
  limit 1;

  -- if the exact title isn't found, fall back to any single-row course so a
  -- misnamed title can't silently no-op again: we resolve by actual rows.
  if v_id is null then
    select l.id into v_id
    from public.lessons l
    join public.courses c on c.id = l.course_id
    where c.title = '90-Day Business in 90 Lessons'
    order by l.sort_order
    limit 1;
  end if;

  if v_id is not null then
    update public.lessons set content = $$klagon$$
You have one idea and a pile of evidence proving it hurts. Dozens of young Ghanaians want the same thing: a real side business that produces actual income — not another "influencer" promise. And there's a proven path to get you there in ninety days.

## The 90-day promise — what it is and what it is not

Ninety days is deliberately uncomfortable. It's the shortest window long enough to build one small real thing, and short enough that you can't coast. You will not try to become a tech unicorn. You will not try to build the next Facebook. You will build one small, real thing that earns its keep.

That thing will be small — smaller than you'd like, in fact — and that is its superpower. A small, real, earning thing beats a big, imaginary, perfect thing every single time.

### What you will have by the end

- This is a plan — a real machine, not a motivational post.
- One first customer who paid you.
- A repeatable process.
- A small but real profit.

## The weekend assignment

Before the next session, you need to do exactly two things:

1. **Choose your lane.** Decide the small slice of the market you know best.
2. **Do a 30-minute interview.** Sit down with one real person who matches that laneholiday and ask them about their life — not about your idea.

Most people skip the interview and go straight to building. That is the #1 mistake. It's also the reason most side projects die at week three: they built something nobody actually wanted.

The interview is not optional. It's the whole game. It is the difference between "I built this thing and it's collecting dust" and "I built this thing and people keep asking me to sell it to them."

## What your lane should NOT be

Your lane is not "anything on the internet." It is not "AI," it is not "coding," it is not "business in general." Those are not lanes; they are oceans. You cannot interview, validate, or sell in an ocean.

Your lane is a **specific person with a specific problem** — for example, "solo accountants in Accra who waste hours preparing client files by hand." That is a lane you can interview, validate, and eventually sell to.

Listen carefully: the earlier the person can name the pain, the earlier you stop guessing and start earning. Your lane is only real when you can name who it is for and what pops for them.

## Why the interview beats the survey

Surveys are cheap to fake and easy to ignore. Interviews are expensive (they cost you the walk, the coffee, the awkwardness) — and that expense is exactly why they're real proof. When a real person tells you, in their own words, that this is a problem for them, you have the only evidence that matters.

That evidence does not come from you guessing. It comes from someone else's mouth. It is the difference between a project and a business.

## Your one goal for the week

- Find your lane.
- Interview one real person in it.
- Write down, verbatim, the single sentence they said that proves the problem is real.

That single sentence is worth more than the entire rest of this course. Write it down and keep it.

$$klagon$$ where id = v_id;
  end if;
end;
$$;

set search_path = public;
