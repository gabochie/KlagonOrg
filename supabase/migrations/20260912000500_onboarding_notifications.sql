-- Onboarding + notifications: welcome notification & badge on approval,
-- `onboarded_at` flag on profiles, notifications table with RLS.

-- ---------- notifications ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'system',
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "members read own notifications" on public.notifications;
create policy "members read own notifications"
  on public.notifications for select
  using (auth.uid() = member_id);

drop policy if exists "members update own notifications" on public.notifications;
create policy "members update own notifications"
  on public.notifications for update
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);

-- ---------- profiles: onboarding flag ----------
alter table public.profiles add column if not exists onboarded_at timestamptz;

-- ---------- welcome badge ----------
insert into public.badges (name, icon)
values ('Welcome', '🎉')
on conflict (name) do nothing;

-- ---------- on-approval trigger ----------
create or replace function public.on_profile_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    insert into public.notifications (member_id, type, title, body, link)
    values (
      new.id,
      'welcome',
      'Welcome to KlagonOrg! 🎉',
      'Your membership is approved. Start a course or join an event to earn your first XP.',
      '/dashboard/member'
    );
    insert into public.member_badges (member_id, badge_id)
    select new.id, id from public.badges where name = 'Welcome'
    on conflict (member_id, badge_id) do nothing;
    update public.profiles set xp = xp + 10 where id = new.id and xp < 10;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_on_approved on public.profiles;
create trigger profiles_on_approved
  after update of status on public.profiles
  for each row
  when (new.status = 'approved' and old.status is distinct from 'approved')
  execute function public.on_profile_approved();