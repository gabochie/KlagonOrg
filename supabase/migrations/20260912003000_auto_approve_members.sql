-- Lead-gen: members are approved at signup. Approval becomes moderation-only
-- (admins can still set pending/rejected); the welcome package fires on insert.
alter table public.profiles alter column status set default 'approved';

drop trigger if exists profiles_on_approved_insert on public.profiles;
create trigger profiles_on_approved_insert
  after insert on public.profiles
  for each row
  when (new.status = 'approved')
  execute function public.on_profile_approved();