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
