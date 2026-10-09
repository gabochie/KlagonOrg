-- ============================================================================
-- PAYMENTS SECURITY HARDENING (C1 + H1). Additive, idempotent.
--
-- C1: get_*_sendable RPCs returned payer PII (emails, phones, names) to
-- anon callers holding only a guessable KLG- ref. Each now requires the
-- worker-only confirm secret (same confirm_secret_ok() guard as the
-- confirm_* RPCs). The worker calls all seven sites signed (sbRpcSigned).
-- Anon callers without the secret get SQLSTATE 42501 'forbidden'.
--
-- H1: quiz + quiz-question policies gated only on published=true, so paid
-- course answers (correct_index) were anon-readable while lessons were
-- properly entitlement-gated. Both policies now mirror lessons_read_public:
-- free courses stay public; priced courses require has_course_access().
-- Re-runnable: YES. Destructive: NO.
-- ============================================================================

-- ---- C1a: donation sendable ----
-- M2 companion: also exposes the order's own phone + network so the OTP
-- confirm re-submits server values instead of trusting the browser.
-- DROP first: widening the RETURNS table cannot use CREATE OR REPLACE.
drop function if exists public.get_donation_sendable(text);

create function public.get_donation_sendable(p_ref text)
returns table (email text, full_name text, amount_ghs numeric, phone text, network text)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select d.email, d.full_name, d.amount_ghs, d.phone,
           coalesce(d.metadata->>'network', d.metadata->>'channel')
    from public.donations d
    where d.provider_ref = p_ref
    limit 1;
end;
$$;

-- ---- C1b: boost sendable ----
create or replace function public.get_boost_sendable(p_ref text)
returns table (post_title text, amount_ghs numeric, payer_phone text, tier text, days int)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select p.title, b.amount_ghs, b.payer_phone, b.tier::text, b.days
    from public.boost_payments b
    join public.posts p on p.id = b.post_id
    where b.provider_ref = p_ref;
end;
$$;

-- ---- C1c: sponsor sendable ----
create or replace function public.get_sponsor_sendable(p_ref text)
returns table (
  org_name text,
  full_name text,
  email text,
  payer_phone text,
  amount_ghs numeric,
  tier text,
  months int
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select a.org_name, a.full_name, a.email, s.payer_phone, s.amount_ghs, s.tier::text, s.months
    from public.sponsor_payments s
    left join public.sponsor_applications a on a.id = s.application_id
    where s.provider_ref = p_ref;
end;
$$;

-- ---- C1d: course sendable ----
create or replace function public.get_course_sendable(p_ref text)
returns table (
  course_title text,
  amount_ghs numeric,
  payer_phone text,
  member_email text,
  member_name text
)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select c.title, p.amount_ghs, p.payer_phone,
           pr.email::text, pr.full_name
    from public.course_payments p
    join public.courses c on c.id = p.course_id
    left join public.profiles pr on pr.id = p.member_id
    where p.provider_ref = p_ref;
end;
$$;

-- ---- H1a: quizzes gated like lessons ----
drop policy if exists "quizzes_read_public" on public.quizzes;
create policy "quizzes_read_public" on public.quizzes
  for select using (exists (
    select 1 from public.lessons l
    join public.courses c on c.id = l.course_id
    where l.id = quizzes.lesson_id
      and c.published = true
      and (c.price_ghs is null or public.has_course_access(c.id))
  ));

-- ---- H1b: quiz questions (incl. correct_index) gated like lessons ----
drop policy if exists "quiz_questions_read_public" on public.quiz_questions;
create policy "quiz_questions_read_public" on public.quiz_questions
  for select using (exists (
    select 1 from public.quizzes q
    join public.lessons l on l.id = q.lesson_id
    join public.courses c on c.id = l.course_id
    where q.id = quiz_questions.quiz_id
      and c.published = true
      and (c.price_ghs is null or public.has_course_access(c.id))
  ));
