-- Blog reading completion: XP + Reader badge + notification on first completion,
-- mirroring the lesson_progress / award_lesson_xp pattern.

create table if not exists public.reader_completions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  slug text not null,
  completed_at timestamptz not null default now(),
  unique (member_id, slug)
);

alter table public.reader_completions enable row level security;

drop policy if exists "reader_completions_select_own" on public.reader_completions;
create policy "reader_completions_select_own"
  on public.reader_completions for select
  using (member_id = auth.uid());

drop policy if exists "reader_completions_write_self" on public.reader_completions;
create policy "reader_completions_write_self"
  on public.reader_completions for insert
  with check (member_id = auth.uid() and public.is_approved_member());

-- Reader badge
insert into public.badges (name, icon)
values ('Reader', '📖')
on conflict (name) do nothing;

create or replace function public.award_reader_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.reader_completions
    where member_id = NEW.member_id and slug = NEW.slug and id <> NEW.id
  ) then
    update public.profiles set xp = coalesce(xp, 0) + 10 where id = NEW.member_id;
    insert into public.member_badges (member_id, badge_id)
    select NEW.member_id, id from public.badges where name = 'Reader'
    on conflict (member_id, badge_id) do nothing;
    insert into public.notifications (member_id, type, title, body, link)
    values (
      NEW.member_id,
      'reading',
      'Article read 📖',
      'You finished an article and earned +10 XP. Keep reading to build your learning streak.',
      '/blog'
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_award_reader_xp on public.reader_completions;
create trigger trg_award_reader_xp
after insert on public.reader_completions
for each row execute function public.award_reader_xp();