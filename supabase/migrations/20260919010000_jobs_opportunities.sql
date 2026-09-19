-- Jobs & Opportunities (P1 #7): automatic expiry for job listings.
-- Approved job posts get a 30-day shelf life by default. The public jobs
-- board hides expired listings; the poster still sees them under My posts.
--
-- Apply: Supabase dashboard -> SQL Editor (same as the events migration).

alter table public.posts
  add column if not exists expires_at timestamptz;

create or replace function public.set_post_expires_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.type = 'job' and new.status = 'approved' and new.expires_at is null then
    new.expires_at := now() + interval '30 days';
  end if;
  return new;
end;
$$;

drop trigger if exists posts_set_expires_at on public.posts;
create trigger posts_set_expires_at
  before insert or update of status, type, expires_at on public.posts
  for each row execute function public.set_post_expires_at();

-- Backfill any already-approved job posts so they start expiring from now.
update public.posts
  set expires_at = now() + interval '30 days'
  where type = 'job' and status = 'approved' and expires_at is null;

create index if not exists posts_expires_at_idx
  on public.posts (expires_at)
  where expires_at is not null;