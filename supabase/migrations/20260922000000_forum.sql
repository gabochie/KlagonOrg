-- ============================================================
-- Community Forum — baseline (discussion boards + replies).
--
-- * Read: public (anon + authenticated) — visible boards, threads
--   and replies are readable by everyone.
-- * Write: authenticated members only. Members open threads on a
--   board and reply to any non-closed thread. Authors may edit
--   their own open thread title/body and delete their own posts.
-- * Moderation: only admins (is_admin) can pin/close/hide or hard
--   delete (which cascades to replies). Reports can be reused via
--   post_reports once threads gain stable public URLs.
--
-- Apply: Supabase dashboard -> SQL Editor (or CLI runner).
-- ============================================================

-- ---------- boards (static categories, seeded below) ----------
create table if not exists public.forum_boards (
  id text primary key,
  name text not null,
  description text,
  icon text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- threads ----------
create table if not exists public.forum_threads (
  id uuid not null default gen_random_uuid() primary key,
  board_id text not null references public.forum_boards(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  body text not null check (char_length(body) between 2 and 20000),
  pinned boolean not null default false,
  closed boolean not null default false,
  status text not null default 'visible'
    check (status in ('visible', 'hidden')),
  reply_count integer not null default 0,
  last_reply_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- replies ----------
create table if not exists public.forum_posts (
  id uuid not null default gen_random_uuid() primary key,
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 20000),
  status text not null default 'visible'
    check (status in ('visible', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_threads_board_idx on public.forum_threads (board_id, status, pinned, last_reply_at);
create index if not exists forum_threads_author_idx on public.forum_threads (author_id);
create index if not exists forum_posts_thread_idx on public.forum_posts (thread_id, created_at);
create index if not exists forum_posts_author_idx on public.forum_posts (author_id);

-- ---------- reply count / last-reply maintenance ----------
create or replace function public.forum_refresh_reply_stats()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_threads
       set reply_count = reply_count + 1,
           last_reply_at = new.created_at
     where id = new.thread_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.forum_threads
       set reply_count = greatest(reply_count - 1, 0),
           last_reply_at = (
             select max(fp.created_at)
             from public.forum_posts fp
             where fp.thread_id = old.thread_id and fp.status = 'visible'
           )
     where id = old.thread_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists forum_posts_reply_stats on public.forum_posts;
create trigger forum_posts_reply_stats
  after insert or delete on public.forum_posts
  for each row execute function public.forum_refresh_reply_stats();

-- ---------- updated_at touch ----------
create or replace function public.forum_touch_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists forum_threads_touch on public.forum_threads;
create trigger forum_threads_touch
  before update on public.forum_threads
  for each row execute function public.forum_touch_updated_at();

drop trigger if exists forum_posts_touch on public.forum_posts;
create trigger forum_posts_touch
  before update on public.forum_posts
  for each row execute function public.forum_touch_updated_at();

-- ---------- RLS ----------
alter table public.forum_boards enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;

-- boards: anyone reads, admins manage
drop policy if exists "forum_boards_select_public" on public.forum_boards;
create policy "forum_boards_select_public" on public.forum_boards
  for select to anon, authenticated using (true);

drop policy if exists "forum_boards_admin_all" on public.forum_boards;
create policy "forum_boards_admin_all" on public.forum_boards
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- threads: public read of visible threads only
drop policy if exists "forum_threads_select_public" on public.forum_threads;
create policy "forum_threads_select_public" on public.forum_threads
  for select to anon, authenticated using (status = 'visible');

-- members open threads
drop policy if exists "forum_threads_insert_member" on public.forum_threads;
create policy "forum_threads_insert_member" on public.forum_threads
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and status = 'visible'
  );

-- authors edit their own open, unpinned thread
drop policy if exists "forum_threads_update_own_open" on public.forum_threads;
create policy "forum_threads_update_own_open" on public.forum_threads
  for update to authenticated
  using (
    author_id = auth.uid()
    and pinned = false
    and closed = false
    and status = 'visible'
  )
  with check (
    author_id = auth.uid()
    and pinned = false
    and closed = false
    and status = 'visible'
  );

-- authors delete their own threads
drop policy if exists "forum_threads_delete_own" on public.forum_threads;
create policy "forum_threads_delete_own" on public.forum_threads
  for delete to authenticated
  using (author_id = auth.uid());

-- admins moderate everything
drop policy if exists "forum_threads_admin_all" on public.forum_threads;
create policy "forum_threads_admin_all" on public.forum_threads
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- replies: public read of visible only
drop policy if exists "forum_posts_select_public" on public.forum_posts;
create policy "forum_posts_select_public" on public.forum_posts
  for select to anon, authenticated using (status = 'visible');

-- members reply to open, visible threads
drop policy if exists "forum_posts_insert_member" on public.forum_posts;
create policy "forum_posts_insert_member" on public.forum_posts
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and status = 'visible'
    and exists (
      select 1 from public.forum_threads t
      where t.id = forum_posts.thread_id
        and t.status = 'visible'
        and t.closed = false
    )
  );

-- authors delete their own replies
drop policy if exists "forum_posts_delete_own" on public.forum_posts;
create policy "forum_posts_delete_own" on public.forum_posts
  for delete to authenticated
  using (author_id = auth.uid());

-- admins moderate everything
drop policy if exists "forum_posts_admin_all" on public.forum_posts;
create policy "forum_posts_admin_all" on public.forum_posts
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- seed boards ----------
-- Icons are NULL: the app renders a board icon per board id so the DB
-- stays plain ASCII (no copy/paste mangling through the SQL editor).
insert into public.forum_boards (id, name, description, icon, position)
values
  ('general',    'General Talk',       'Open conversation about life in Klagon and beyond.', NULL, 1),
  ('ask',        'Ask & Help',         'Questions, recommendations and community advice.', NULL, 2),
  ('culture',    'Culture & Chieftaincy', 'Heritage, arts, festivals and chieftaincy matters.', NULL, 3),
  ('market',     'Marketplace Talk',   'Buying, selling and experiences with local vendors.', NULL, 4),
  ('suggest',    'Site Feedback',      'Ideas and feedback for klagon.org itself.', NULL, 5)
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      icon = excluded.icon,
      position = excluded.position;

-- sanity check (boards readable by anon)
select b.id, b.name, b.position
from public.forum_boards b
order by b.position;