-- Volunteer role tracking + XP for completed lessons.
alter table public.volunteer_signups add column if not exists role text;

create or replace function public.award_lesson_xp()
returns trigger
language plpgsql
security definer
as $$
begin
  if not exists (
    select 1 from public.lesson_progress
    where member_id = NEW.member_id and lesson_id = NEW.lesson_id and id <> NEW.id
  ) then
    update public.profiles set xp = coalesce(xp, 0) + 10 where id = NEW.member_id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_award_lesson_xp on public.lesson_progress;
create trigger trg_award_lesson_xp
after insert on public.lesson_progress
for each row execute function public.award_lesson_xp();