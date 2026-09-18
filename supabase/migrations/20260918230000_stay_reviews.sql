-- ============================================================
-- Visit Klagon (stays-first pivot) — tourism fields + reviews.
-- Youth mission untouched; this adds the visitor revenue door.
--
-- sponsors: stay/visit fields (nullable, additive only).
-- reviews: visitor + staff-seeded reviews for sponsors and posts.
-- ============================================================

-- ---------- sponsors tourism columns ----------
alter table public.sponsors
  add column if not exists photos text[] not null default '{}',
  add column if not exists price_range text,
  add column if not exists amenities text[] not null default '{}',
  add column if not exists check_in text,
  add column if not exists check_out text,
  add column if not exists stay_type text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists booking_note text;

-- ---------- reviews ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  -- exactly one target per review
  sponsor_id uuid references public.sponsors(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  reviewer_name text not null,
  reviewer_id uuid references public.profiles(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text,
  photos text[] not null default '{}',
  staff_pick boolean not null default false,
  reply text,
  replied_at timestamptz,
  helpful int not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  constraint reviews_one_target check (
    (sponsor_id is not null and post_id is null)
    or (sponsor_id is null and post_id is not null)
  ),
  constraint reviews_staff_pick_needs_reviewer check (
    staff_pick = false or reviewer_id is not null
  )
);

create index if not exists reviews_sponsor_idx on public.reviews (sponsor_id, status, created_at desc);
create index if not exists reviews_post_idx on public.reviews (post_id, status, created_at desc);

alter table public.reviews enable row level security;

-- Public reads approved reviews only.
drop policy if exists "reviews_read_approved" on public.reviews;
create policy "reviews_read_approved" on public.reviews
  for select using (status = 'approved');

-- Members (and anon visitors leaving a name) submit -> always pending.
drop policy if exists "reviews_insert_open" on public.reviews;
create policy "reviews_insert_open" on public.reviews
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and coalesce(trim(reviewer_name), '') <> ''
    and rating between 1 and 5
  );

-- Helpful votes go through a narrow RPC (increments only) so the
-- counter can't be used to rewrite review content.
create or replace function public.bump_review_helpful(p_review_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.reviews
     set helpful = helpful + 1
   where id = p_review_id and status = 'approved';
end;
$$;

revoke all on function public.bump_review_helpful(uuid) from public;
grant execute on function public.bump_review_helpful(uuid) to anon, authenticated;

-- Admins full access (moderate, reply, staff-pick).
drop policy if exists "reviews_admin_all" on public.reviews;
create policy "reviews_admin_all" on public.reviews
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
