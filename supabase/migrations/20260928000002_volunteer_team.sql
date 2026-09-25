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
