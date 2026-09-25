-- ONE-TIME manual apply for the Volunteer Program (Phases A-F).
-- How: Supabase Dashboard > SQL Editor > New query > paste this entire file > Run.
-- Do NOT move this file into supabase/migrations/ (it would double-apply on db push).
-- Safe to re-run: every statement is idempotent.
-- Contents, in order: 20260928000000_course_covers, 20260928000001_volunteer_applications,
--   20260928000002_volunteer_team, 20260928000003_org_roles_volunteer,
--   20260928000004_volunteer_performance.

-- Phase A: course feature images.
-- Adds courses.cover_url, a public-read course-media bucket (admin writes),
-- and exposes cover_url through courses_public. Rendering falls back to the
-- existing pastel+emoji block when cover_url is null (the placeholder rule).

alter table public.courses
  add column if not exists cover_url text;

-- ---------- course-media bucket ----------
insert into storage.buckets (id, name, public)
values ('course-media', 'course-media', true)
on conflict (id) do nothing;

-- Public reads course covers.
drop policy if exists "course_media_read_public" on storage.objects;
create policy "course_media_read_public" on storage.objects
  for select using (bucket_id = 'course-media');

-- Admins upload into per-course folders only.
drop policy if exists "course_media_insert_admin" on storage.objects;
create policy "course_media_insert_admin" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'course-media'
    and public.is_admin()
    and (storage.foldername(name))[1] = 'courses'
  );

-- Admins remove covers.
drop policy if exists "course_media_delete_admin" on storage.objects;
create policy "course_media_delete_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'course-media'
    and public.is_admin()
    and (storage.foldername(name))[1] = 'courses'
  );

-- ---------- courses_public: expose cover_url ----------
-- NOTE: cover_url is appended LAST. CREATE OR REPLACE VIEW matches columns
-- by position, so inserting it mid-list fails with 42P16.
create or replace view public.courses_public as
select
  c.id,
  c.title,
  c.category,
  c.icon,
  c.description,
  c.created_at,
  count(l.id)::int as lesson_count,
  c.cover_url
from public.courses c
left join public.lessons l on l.course_id = c.id
where c.published = true
group by c.id
order by c.created_at asc;

alter view public.courses_public
  set (security_invoker = true);

-- Phase B: volunteer applications with terms, Ghana Card ID + photo, probation.
-- Replaces one-click volunteer_signups with a verifiable application pipeline:
-- pending -> probationary (30 days) -> active | inactive, or rejected.
-- ID fields live on the application (not profiles): scoped, admin-read-only,
-- never exposed publicly. Photo uploads go to the member-media bucket.

-- ---------- applications ----------
create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  role text not null,
  status text not null default 'pending'
    check (status in ('pending', 'probationary', 'active', 'inactive', 'rejected')),
  terms_accepted_at timestamptz not null default now(),
  terms_version text not null default '2026-09',
  id_type text not null check (id_type in ('ghana_card', 'voter_id', 'passport', 'drivers_license')),
  id_number text not null,
  photo_url text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  probation_ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique nulls not distinct (member_id, post_id, role)
);

-- ---------- RLS ----------
alter table public.volunteer_applications enable row level security;

drop policy if exists "volunteer_applications_select_own_or_admin" on public.volunteer_applications;
create policy "volunteer_applications_select_own_or_admin" on public.volunteer_applications
  for select using (public.is_admin() or member_id = auth.uid());

drop policy if exists "volunteer_applications_insert_self" on public.volunteer_applications;
create policy "volunteer_applications_insert_self" on public.volunteer_applications
  for insert with check (member_id = auth.uid() and public.is_approved_member());

drop policy if exists "volunteer_applications_admin_all" on public.volunteer_applications;
create policy "volunteer_applications_admin_all" on public.volunteer_applications
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- member-media bucket (ID/selfie photos, future avatars) ----------
insert into storage.buckets (id, name, public)
values ('member-media', 'member-media', true)
on conflict (id) do nothing;

-- Public reads (photos are shown on Team page / profiles once approved).
drop policy if exists "member_media_read_public" on storage.objects;
create policy "member_media_read_public" on storage.objects
  for select using (bucket_id = 'member-media');

-- Members upload into their own folder only.
drop policy if exists "member_media_insert_own" on storage.objects;
create policy "member_media_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'member-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Members remove their own uploads.
drop policy if exists "member_media_delete_own" on storage.objects;
create policy "member_media_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'member-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- application lifecycle: probation date + member notifications ----------
create or replace function public.volunteer_application_events()
returns trigger
language plpgsql
security definer
as $$
begin
  -- New application received.
  if TG_OP = 'INSERT' then
    insert into public.notifications (member_id, type, title, body, link)
    values (
      NEW.member_id, 'volunteer',
      'Application received 🙋',
      'Your application for "' || NEW.role || '" is under review. We will confirm within a few days.',
      '/dashboard/volunteer'
    );
    return NEW;
  end if;

  -- Status transitions.
  if TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    if NEW.status = 'probationary' then
      NEW.probation_ends_at := coalesce(NEW.probation_ends_at, now() + interval '30 days');
      NEW.reviewed_at := coalesce(NEW.reviewed_at, now());
      insert into public.notifications (member_id, type, title, body, link)
      values (
        NEW.member_id, 'volunteer',
        'Welcome aboard — probation started 🎉',
        'Your 30-day probation for "' || NEW.role || '" has begun. It is unpaid and your continuation depends on performance during these 30 days.',
        '/dashboard/volunteer'
      );
    elsif NEW.status = 'active' then
      NEW.reviewed_at := coalesce(NEW.reviewed_at, now());
      insert into public.notifications (member_id, type, title, body, link)
      values (
        NEW.member_id, 'volunteer',
        'You are confirmed ✅',
        'Your probation review for "' || NEW.role || '" passed. Thank you for your service to Klagon.',
        '/dashboard/volunteer'
      );
    elsif NEW.status = 'inactive' then
      insert into public.notifications (member_id, type, title, body, link)
      values (
        NEW.member_id, 'volunteer',
        'Volunteer role update',
        'Your "' || NEW.role || '" engagement has ended. Thank you for the time you gave — you can apply for other roles anytime.',
        '/dashboard/volunteer'
      );
    elsif NEW.status = 'rejected' then
      insert into public.notifications (member_id, type, title, body, link)
      values (
        NEW.member_id, 'volunteer',
        'Application update',
        'Your application for "' || NEW.role || '" was not successful this time. You are welcome to apply for other roles.',
        '/volunteer'
      );
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_volunteer_application_events on public.volunteer_applications;
create trigger trg_volunteer_application_events
before insert or update on public.volunteer_applications
for each row execute function public.volunteer_application_events();

-- Phase C: public Team roster, auto-maintained from application approvals.
-- A member appears on /team when probationary or active; hidden when the
-- engagement ends (inactive/rejected). Probationary members carry an
-- "On probation" badge — honest about who is new.

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references public.profiles(id) on delete cascade,
  application_id uuid references public.volunteer_applications(id) on delete set null,
  role text not null,
  photo_url text,
  status text not null default 'probationary'
    check (status in ('probationary', 'active')),
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.team_members enable row level security;

drop policy if exists "team_members_read_public" on public.team_members;
create policy "team_members_read_public" on public.team_members
  for select using (is_active = true);

drop policy if exists "team_members_admin_all" on public.team_members;
create policy "team_members_admin_all" on public.team_members
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- auto-maintain roster from application status ----------
create or replace function public.volunteer_team_sync()
returns trigger
language plpgsql
security definer
as $$
begin
  if TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    if NEW.status in ('probationary', 'active') then
      insert into public.team_members (member_id, application_id, role, photo_url, status, is_active, joined_at)
      values (NEW.member_id, NEW.id, NEW.role, NEW.photo_url, NEW.status, true, now())
      on conflict (member_id) do update set
        application_id = excluded.application_id,
        role = excluded.role,
        photo_url = excluded.photo_url,
        status = excluded.status,
        is_active = true;
    elsif NEW.status in ('inactive', 'rejected') then
      update public.team_members
      set is_active = false
      where member_id = NEW.member_id;
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_volunteer_team_sync on public.volunteer_applications;
create trigger trg_volunteer_team_sync
after update on public.volunteer_applications
for each row execute function public.volunteer_team_sync();

-- Phase D: move the 9 org openings under the Volunteer tab as claimable roles.
-- 1) Flags them (details.org_role) so the Volunteer tab lists them and the
--    /jobs board excludes them.
-- 2) Rewrites compensation copy to unpaid terms (no pay until further notice).
-- 3) Rewrites the "How to apply: WhatsApp…" closing paragraph to the
--    in-app claim flow (Ghana Card ID + photo + Volunteer Terms).
-- Idempotent: all updates are conditional and re-runnable.

-- 1) Flag org roles.
update public.posts
set details = coalesce(details, '{}'::jsonb) || '{"org_role": true}'::jsonb
where type = 'job'
  and author_name = 'KLAGON.org Team'
  and status = 'approved'
  and coalesce(details->>'org_role', 'false') <> 'true';

-- 2) Unpaid compensation terms (replaces stipend wording).
update public.posts
set details = jsonb_set(
  coalesce(details, '{}'::jsonb),
  '{salary_range_ghs}',
  '"Unpaid volunteer role — no pay until further notice. 30-day probation; continuation depends on performance."'
)
where type = 'job'
  and author_name = 'KLAGON.org Team'
  and status = 'approved';

-- 3) Claim flow replaces WhatsApp apply (final paragraph of each body).
update public.posts
set body = regexp_replace(
  body,
  'How to apply:.*$',
  'How to apply: claim this role on the Volunteer page (/volunteer) with your Ghana Card ID, a clear photo, and acceptance of the Volunteer Terms. All roles are unpaid until further notice, starting with a 30-day probation — continuation depends on performance.'
)
where type = 'job'
  and author_name = 'KLAGON.org Team'
  and status = 'approved'
  and body ~ 'How to apply:';

-- Sanity check: flagged org roles with unpaid terms.
select title,
  (details->>'org_role') as org_role,
  left(details->>'salary_range_ghs', 40) as terms,
  (body ~ 'claim this role on the Volunteer page') as claim_path
from public.posts
where type = 'job' and author_name = 'KLAGON.org Team' and status = 'approved'
order by title;

-- Phase E: volunteer performance ledger + gamification.
-- Tasks (assigned by admin, done by volunteer), hours (logged by volunteer,
-- verified by admin), reviews (ratings by admin). XP flows mirror the lesson
-- XP pattern (+10 units): task done +10, whole hour logged +2, 5-star review
-- +25 with Star Volunteer badge, confirmation earns Probation Passed badge.
-- Every performance event notifies the member (Phase F rides these triggers).

-- ---------- tables ----------
create table if not exists public.volunteer_tasks (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.volunteer_applications(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'done')),
  xp_awarded boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.volunteer_hours (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.volunteer_applications(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  hours numeric not null check (hours > 0 and hours <= 24),
  worked_on date not null,
  note text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.volunteer_reviews (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.volunteer_applications(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  rating int not null check (rating between 1 and 5),
  note text,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.volunteer_tasks enable row level security;
alter table public.volunteer_hours enable row level security;
alter table public.volunteer_reviews enable row level security;

-- Tasks: members read their own engagement's tasks; admins all; only admins create.
drop policy if exists "volunteer_tasks_select_own_or_admin" on public.volunteer_tasks;
create policy "volunteer_tasks_select_own_or_admin" on public.volunteer_tasks
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.volunteer_applications a
      where a.id = volunteer_tasks.application_id and a.member_id = auth.uid()
    )
  );

drop policy if exists "volunteer_tasks_insert_admin" on public.volunteer_tasks;
create policy "volunteer_tasks_insert_admin" on public.volunteer_tasks
  for insert with check (public.is_admin());

drop policy if exists "volunteer_tasks_update_owner_or_admin" on public.volunteer_tasks;
create policy "volunteer_tasks_update_owner_or_admin" on public.volunteer_tasks
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.volunteer_applications a
      where a.id = volunteer_tasks.application_id and a.member_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or (
      status in ('open', 'done')
      and exists (
        select 1 from public.volunteer_applications a
        where a.id = volunteer_tasks.application_id and a.member_id = auth.uid()
      )
    )
  );

drop policy if exists "volunteer_tasks_admin_delete" on public.volunteer_tasks;
create policy "volunteer_tasks_admin_delete" on public.volunteer_tasks
  for delete using (public.is_admin());

-- Hours: members read/insert their own; only admins verify or delete.
drop policy if exists "volunteer_hours_select_own_or_admin" on public.volunteer_hours;
create policy "volunteer_hours_select_own_or_admin" on public.volunteer_hours
  for select using (public.is_admin() or member_id = auth.uid());

drop policy if exists "volunteer_hours_insert_self" on public.volunteer_hours;
create policy "volunteer_hours_insert_self" on public.volunteer_hours
  for insert with check (
    member_id = auth.uid()
    and public.is_approved_member()
    and exists (
      select 1 from public.volunteer_applications a
      where a.id = volunteer_hours.application_id and a.member_id = auth.uid()
    )
  );

drop policy if exists "volunteer_hours_admin_all" on public.volunteer_hours;
create policy "volunteer_hours_admin_all" on public.volunteer_hours
  for all using (public.is_admin()) with check (public.is_admin());

-- Reviews: members read their own; only admins write.
drop policy if exists "volunteer_reviews_select_own_or_admin" on public.volunteer_reviews;
create policy "volunteer_reviews_select_own_or_admin" on public.volunteer_reviews
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.volunteer_applications a
      where a.id = volunteer_reviews.application_id and a.member_id = auth.uid()
    )
  );

drop policy if exists "volunteer_reviews_admin_write" on public.volunteer_reviews;
create policy "volunteer_reviews_admin_write" on public.volunteer_reviews
  for insert with check (public.is_admin());

drop policy if exists "volunteer_reviews_admin_update" on public.volunteer_reviews;
create policy "volunteer_reviews_admin_update" on public.volunteer_reviews
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------- gamification badges ----------
insert into public.badges (name, icon) values
  ('Probation Passed', '🎉'),
  ('Star Volunteer', '⭐')
on conflict (name) do nothing;

-- ---------- XP + notifications ----------
-- Task completed: +10 XP once.
create or replace function public.volunteer_task_done_xp()
returns trigger
language plpgsql
security definer
as $$
declare
  v_member uuid;
  v_title text;
begin
  if NEW.status = 'done' and OLD.status = 'open' and not NEW.xp_awarded then
    NEW.xp_awarded := true;
    select member_id into v_member
    from public.volunteer_applications where id = NEW.application_id;
    if v_member is not null then
      update public.profiles set xp = coalesce(xp, 0) + 10 where id = v_member;
      select title into v_title from public.volunteer_tasks where id = NEW.id;
      insert into public.notifications (member_id, type, title, body, link)
      values (
        v_member, 'volunteer',
        'Task done +10 XP ✅',
        'Nicely done' || case when v_title is not null then ' on "' || v_title || '"' else '' end || '. Keep the streak going.',
        '/dashboard/volunteer'
      );
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_volunteer_task_done_xp on public.volunteer_tasks;
create trigger trg_volunteer_task_done_xp
before update on public.volunteer_tasks
for each row execute function public.volunteer_task_done_xp();

-- Hours logged: +2 XP per whole hour.
create or replace function public.volunteer_hours_xp()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.profiles
  set xp = coalesce(xp, 0) + floor(NEW.hours)::int * 2
  where id = NEW.member_id;
  return NEW;
end;
$$;

drop trigger if exists trg_volunteer_hours_xp on public.volunteer_hours;
create trigger trg_volunteer_hours_xp
after insert on public.volunteer_hours
for each row execute function public.volunteer_hours_xp();

-- Hours verified: notify the member.
create or replace function public.volunteer_hours_verified_notify()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.verified and not OLD.verified then
    insert into public.notifications (member_id, type, title, body, link)
    values (
      NEW.member_id, 'volunteer',
      'Hours verified ✅',
      NEW.hours::text || 'h for ' || NEW.worked_on::text || ' verified. Thank you for showing up.',
      '/dashboard/volunteer'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_volunteer_hours_verified_notify on public.volunteer_hours;
create trigger trg_volunteer_hours_verified_notify
after update on public.volunteer_hours
for each row execute function public.volunteer_hours_verified_notify();

-- Task assigned: notify the member.
create or replace function public.volunteer_task_assigned_notify()
returns trigger
language plpgsql
security definer
as $$
declare
  v_member uuid;
begin
  select member_id into v_member
  from public.volunteer_applications where id = NEW.application_id;
  if v_member is not null then
    insert into public.notifications (member_id, type, title, body, link)
    values (
      v_member, 'volunteer',
      'New task 📋',
      '"' || NEW.title || '"' || case when NEW.due_at is not null then ' — due ' || NEW.due_at::date::text else '' end || '. Open it from your volunteer dashboard.',
      '/dashboard/volunteer'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_volunteer_task_assigned_notify on public.volunteer_tasks;
create trigger trg_volunteer_task_assigned_notify
after insert on public.volunteer_tasks
for each row execute function public.volunteer_task_assigned_notify();

-- Review posted: notify + 5-star bonus (once per application).
create or replace function public.volunteer_review_events()
returns trigger
language plpgsql
security definer
as $$
declare
  v_member uuid;
  v_role text;
begin
  select member_id, role into v_member, v_role
  from public.volunteer_applications where id = NEW.application_id;
  if v_member is null then
    return NEW;
  end if;
  insert into public.notifications (member_id, type, title, body, link)
  values (
    v_member, 'volunteer',
    'Performance review ' || repeat('⭐', NEW.rating),
    coalesce('“' || NEW.note || '” ', '') || 'Rated ' || NEW.rating || '/5' ||
      case when NEW.rating = 5 then ' — outstanding! +25 XP and the Star Volunteer badge.' else '.' end,
    '/dashboard/volunteer'
  );
  if NEW.rating = 5 and not exists (
    select 1 from public.volunteer_reviews
    where application_id = NEW.application_id and rating = 5 and id <> NEW.id
  ) then
    update public.profiles set xp = coalesce(xp, 0) + 25 where id = v_member;
    insert into public.member_badges (member_id, badge_id)
    select v_member, b.id from public.badges b where b.name = 'Star Volunteer'
    on conflict (member_id, badge_id) do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_volunteer_review_events on public.volunteer_reviews;
create trigger trg_volunteer_review_events
after insert on public.volunteer_reviews
for each row execute function public.volunteer_review_events();

-- Confirmation earns the Probation Passed badge (extends the status notifier).
create or replace function public.volunteer_confirmation_badge()
returns trigger
language plpgsql
security definer
as $$
begin
  if NEW.status = 'active' and OLD.status is distinct from 'active' then
    insert into public.member_badges (member_id, badge_id)
    select NEW.member_id, b.id from public.badges b where b.name = 'Probation Passed'
    on conflict (member_id, badge_id) do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_volunteer_confirmation_badge on public.volunteer_applications;
create trigger trg_volunteer_confirmation_badge
after update on public.volunteer_applications
for each row execute function public.volunteer_confirmation_badge();

