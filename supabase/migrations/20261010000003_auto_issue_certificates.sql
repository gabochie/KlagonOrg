-- ============================================================================
-- AUTO-ISSUE CERTIFICATES on paid-course completion (additive)
-- When a member completes EVERY lesson of a priced course they hold an
-- entitlement for, and hold no certificate yet, issue one automatically with
-- the same KLG-XX-XXXXXX code scheme as issue_certificate(), plus a
-- notification linking to /verify. Mirrors the manual rule (entitlement
-- required) so free browsing never mints certificates.
-- Trigger: after insert on public.lesson_progress (same hook as award_xp).
-- Re-runnable: YES. Destructive: NO.
-- ============================================================================

create or replace function public.maybe_issue_course_certificate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_total int;
  v_done int;
  v_code text;
  v_title text;
  v_name text;
begin
  select l.course_id into v_course_id
  from public.lessons l
  where l.id = NEW.lesson_id;
  if v_course_id is null then
    return NEW;
  end if;

  -- Only priced, published courses with at least one lesson.
  select c.title into v_title
  from public.courses c
  where c.id = v_course_id
    and c.published = true
    and c.price_ghs is not null;
  if v_title is null then
    return NEW;
  end if;

  -- Entitlement required (same rule as manual issue_certificate).
  if not exists (
    select 1 from public.course_entitlements e
    where e.member_id = NEW.member_id and e.course_id = v_course_id
  ) then
    return NEW;
  end if;

  -- Already certified: nothing to do.
  if exists (
    select 1 from public.certificates c
    where c.member_id = NEW.member_id and c.course_id = v_course_id
  ) then
    return NEW;
  end if;

  -- All lessons complete?
  select count(*) into v_total from public.lessons where course_id = v_course_id;
  select count(distinct lp.lesson_id) into v_done
  from public.lesson_progress lp
  join public.lessons l on l.id = lp.lesson_id
  where lp.member_id = NEW.member_id and l.course_id = v_course_id;
  if v_total < 1 or v_done < v_total then
    return NEW;
  end if;

  select full_name into v_name from public.profiles where id = NEW.member_id;
  v_code := 'KLG-' || upper(substring(regexp_replace(coalesce(v_title, 'X'), '[^A-Za-z]', '', 'g'), 1, 2))
    || '-' || upper(substring(md5(gen_random_uuid()::text || now()::text), 1, 6));

  begin
    insert into public.certificates (code, member_id, course_id, recipient_name)
    values (v_code, NEW.member_id, v_course_id, nullif(btrim(coalesce(v_name, '')), ''));
  exception when unique_violation then
    -- Code collision (16M space) or concurrent completion: keep the existing row.
    select code into v_code from public.certificates
    where member_id = NEW.member_id and course_id = v_course_id;
  end;

  insert into public.notifications (member_id, type, title, body, link)
  values (
    NEW.member_id,
    'certificate',
    'Certificate earned 🎓',
    'You completed ' || v_title || '. Your verifiable certificate (' || v_code || ') is ready to share with employers.',
    '/verify?code=' || v_code
  );
  return NEW;
end;
$$;

drop trigger if exists trg_auto_certificate on public.lesson_progress;
create trigger trg_auto_certificate
after insert on public.lesson_progress
for each row execute function public.maybe_issue_course_certificate();
