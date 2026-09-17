-- ============================================================
-- Klagon Hyperlocal Community News Portal — schema
-- ============================================================
-- Transforms /news into a community portal: one unified `posts`
-- table for news / events / business / classifieds (Properties,
-- Auto, Goods, Services, Jobs) / announcements, with an admin
-- moderation queue, paid boosts, reports and a subscriber list.
--
-- Run AFTER 20260917000000_remove_approval_gate.sql.
-- Reference: Klagon News/portal-schema.sql (v2 preview build).
-- ============================================================

-- ------------------------------------------------------------------
-- 1. Enums
-- ------------------------------------------------------------------
create type public.post_type as enum
  ('news', 'event', 'business', 'classified', 'job', 'announcement');

create type public.post_status as enum
  ('pending', 'approved', 'rejected', 'hidden');

create type public.post_area as enum
  ('klagon', 'tema_west', 'other');

create type public.boost_tier as enum
  ('none', 'featured', 'premium');

create type public.broadcast_kind as enum
  ('email', 'whatsapp', 'social');

-- ------------------------------------------------------------------
-- 2. Extend profiles (verified contributor + approval counter)
-- ------------------------------------------------------------------
alter table public.profiles
  add column if not exists verified_contributor boolean not null default false,
  add column if not exists approved_posts int not null default 0;

-- ------------------------------------------------------------------
-- 3. Core posts table (unified content model)
-- ------------------------------------------------------------------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  type public.post_type not null default 'news',
  title text not null,
  excerpt text,
  body text,
  category text not null default 'General',
  subcategory text,
  details jsonb not null default '{}'::jsonb,
  area public.post_area not null default 'klagon',
  status public.post_status not null default 'pending',
  rejected_reason text,
  submitted_by uuid references public.profiles(id) on delete set null,
  author_name text,
  author_badge text not null default 'member'
    check (author_badge in ('member', 'verified', 'editorial')),
  cover_url text,
  gallery jsonb not null default '[]'::jsonb,

  -- classified / job / business
  price_ghs numeric,
  contact_phone text,
  contact_email text,

  -- events only
  event_date date,
  event_time text,
  event_location text,

  -- boost
  boost_tier public.boost_tier not null default 'none',
  boost_fee_ghs numeric,
  boost_until timestamptz,

  -- trust / stats
  reports int not null default 0,
  views int not null default 0,

  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index posts_feed_idx on public.posts (status, type, published_at desc);
create index posts_area_status_idx on public.posts (area, status);
create index posts_boost_until_idx on public.posts (boost_until) where boost_until is not null;
create index posts_search_idx on public.posts
  using gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,'') || ' ' || coalesce(category,'')));

-- segmented browse: vertical + subcategory + area
create index posts_vertical_idx on public.posts (type, subcategory, area, status);

-- details (jsonb) structured fields by vertical — built by the segmented submit form:
--   Properties   { listing_type: rent|sale|short_stay, currency, size_m2, plots, bedrooms,
--                  bathrooms, furnished, parking, compound }
--   Auto         { make, model, year, mileage, fuel: petrol|diesel|electric, transmission,
--                  condition: new|used, hire }
--   Goods/Services { condition: new|used, negotiable, availability }
--   Jobs         { company, salary_range_ghs, deadline, position_type }

-- author + timestamp snapshot
create or replace function public.posts_before_upsert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.updated_at = now();
  if new.author_name is null then
    new.author_name = coalesce(
      (select full_name from public.profiles where id = coalesce(new.submitted_by, auth.uid())),
      'Community Member'
    );
  end if;
  if new.area is null then new.area = 'klagon'; end if;
  if new.reports < 0 then new.reports = 0; end if;
  return new;
end; $$;

create trigger posts_before_upsert
  before insert or update on public.posts
  for each row execute procedure public.posts_before_upsert();

-- on approval: stamp published_at, count toward Verified Contributor (>=5)
create or replace function public.posts_on_approve()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    new.published_at = coalesce(new.published_at, now());
    if new.submitted_by is not null then
      update public.profiles
        set approved_posts = approved_posts + 1,
            verified_contributor = (approved_posts + 1) >= 5
        where id = new.submitted_by;
    end if;
  end if;
  return new;
end; $$;

create trigger posts_on_approve
  before update on public.posts
  for each row execute procedure public.posts_on_approve();

-- ------------------------------------------------------------------
-- 4. Reports & views
-- ------------------------------------------------------------------
create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reported_by uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (post_id, reported_by)
);

create index post_reports_post_idx on public.post_reports (post_id);

-- keep the denormalized counter + auto-hide after 3 reports
create or replace function public.posts_report_auto_hide()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  c int;
begin
  select count(*) into c from public.post_reports where post_id = new.post_id;
  update public.posts set reports = c, updated_at = now() where id = new.post_id;
  if c >= 3 then
    update public.posts set status = 'hidden', updated_at = now()
    where id = new.post_id and status = 'approved';
  end if;
  return new;
end; $$;

create trigger posts_report_auto_hide
  after insert on public.post_reports
  for each row execute procedure public.posts_report_auto_hide();

create table public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  viewed_at timestamptz not null default now()
);

create index post_views_post_idx on public.post_views (post_id);

-- ------------------------------------------------------------------
-- 5. Contact relay (anonymous buyers reach sellers without exposing phone)
-- ------------------------------------------------------------------
create table public.post_contact_messages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  sender_name text,
  sender_phone text,
  sender_email text,
  message text not null,
  created_at timestamptz not null default now()
);

create index post_contact_messages_post_idx on public.post_contact_messages (post_id);

-- ------------------------------------------------------------------
-- 6. Newsletter / "our list"
-- ------------------------------------------------------------------
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  phone text,
  source text not null default 'portal',
  subscribed boolean not null default true,
  created_at timestamptz not null default now()
);

create index subscribers_email_idx on public.subscribers (lower(email));

create table public.broadcasts (
  id uuid primary key default gen_random_uuid(),
  kind public.broadcast_kind not null,
  post_id uuid references public.posts(id) on delete set null,
  sent_by uuid references public.profiles(id) on delete set null,
  delivered_to int,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- 7. Boost orders
--    Reuses public.donations + the Moolre worker:
--    donations.metadata = { "kind":"boost", "post_id":"...", "tier":"featured" }
--    On payment confirmed the worker calls purchase_boost() (below) or
--    updates posts.boost_tier / boost_fee_ghs / boost_until directly.
-- ------------------------------------------------------------------

-- Pricing (klagon.org portal):
--   premium  (Properties/Auto) -> GH₵ 50, 7 days featured
--   featured (classified)      -> GH₵ 20, 3 days featured
--   featured (news/job/biz)    -> GH₵ 30, 3 days featured
create or replace function public.purchase_boost(p_post_id uuid, p_tier public.boost_tier)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_fee numeric;
  v_days int;
begin
  select * into r from public.posts where id = p_post_id;
  if r is null or r.submitted_by is distinct from auth.uid() then
    return false;
  end if;
  if r.status <> 'approved' or r.boost_until > now() then
    return false;
  end if;
  if p_tier = 'premium' and not (r.type = 'classified' and r.category in ('Properties', 'Auto')) then
    return false; -- premium tier is only for Properties/Auto
  end if;
  if p_tier = 'premium' then
    v_fee := 50; v_days := 7;
  elsif p_tier = 'featured' and r.type = 'classified' then
    v_fee := 20; v_days := 3;
  elsif p_tier = 'featured' then
    v_fee := 30; v_days := 3;
  else
    return false;
  end if;
  update public.posts
    set boost_tier = p_tier,
        boost_fee_ghs = v_fee,
        boost_until = now() + (v_days || ' days')::interval,
        updated_at = now()
    where id = p_post_id;
  return true;
end; $$;

-- ------------------------------------------------------------------
-- 8. RLS
-- ------------------------------------------------------------------
alter table public.posts enable row level security;
alter table public.post_reports enable row level security;
alter table public.post_views enable row level security;
alter table public.post_contact_messages enable row level security;
alter table public.subscribers enable row level security;
alter table public.broadcasts enable row level security;

-- public read: approved only, not report-hidden
create policy "posts_select_public" on public.posts
  for select using (
    status = 'approved'
    and (published_at is null or published_at <= now())
    and reports < 3
  );

-- members submit -> always pending; no boost fields on insert
create policy "posts_insert_member" on public.posts
  for insert to authenticated
  with check (
    submitted_by = auth.uid()
    and status = 'pending'
    and boost_tier = 'none'
  );

create policy "posts_update_own_pending" on public.posts
  for update to authenticated
  using (submitted_by = auth.uid() and status in ('pending', 'rejected'))
  with check (
    submitted_by = auth.uid()
    and status in ('pending', 'rejected')
    and boost_tier is not distinct from 'none'
  );

create policy "posts_delete_own_pending" on public.posts
  for delete to authenticated
  using (submitted_by = auth.uid() and status in ('pending', 'rejected'));

create policy "posts_admin_all" on public.posts
  for all using (public.is_admin()) with check (public.is_admin());

-- reports: members only, dedupe enforced by unique constraint
create policy "post_reports_insert_member" on public.post_reports
  for insert to authenticated
  with check (reported_by = auth.uid());

create policy "post_reports_admin_all" on public.post_reports
  for all using (public.is_admin()) with check (public.is_admin());

-- views: anon + auth insert
create policy "post_views_insert_all" on public.post_views
  for insert to anon, authenticated with check (true);

-- contact relay: anyone can send; admins + post owners can read
create policy "post_contact_messages_insert_anon" on public.post_contact_messages
  for insert to anon, authenticated with check (true);

create policy "post_contact_messages_owner_or_admin" on public.post_contact_messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.posts p
      where p.id = post_contact_messages.post_id
        and p.submitted_by = auth.uid()
    )
  );

-- subscribers: anyone can subscribe, admin manages
create policy "subscribers_insert_anon" on public.subscribers
  for insert to anon, authenticated
  with check (subscribed = true);

create policy "subscribers_admin_all" on public.subscribers
  for all using (public.is_admin()) with check (public.is_admin());

-- broadcasts: admin only
create policy "broadcasts_admin_all" on public.broadcasts
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------------------------
-- 9. Data migration: existing news_articles -> posts
--    Old table kept until the query swap is verified, then dropped
--    in a follow-up migration.
-- ------------------------------------------------------------------
insert into public.posts (
  type, title, excerpt, body, category, status, author_name,
  cover_url, published_at
)
select
  'news'::public.post_type,
  na.title,
  na.excerpt,
  na.body,
  na.category::text,
  case when na.published then 'approved'::public.post_status else 'pending'::public.post_status end,
  coalesce(na.author_name, 'KlagonOrg Newsroom'),
  na.image_url,
  na.published_at
from public.news_articles na
order by na.published_at nulls last;

-- ------------------------------------------------------------------
-- 10. Rollback notes
-- ------------------------------------------------------------------
-- drop table public.posts cascade;
-- drop table public.post_reports cascade;
-- drop table public.post_views cascade;
-- drop table public.post_contact_messages cascade;
-- drop table public.subscribers cascade;
-- drop table public.broadcasts cascade;
-- drop type public.post_type, public.post_status, public.post_area,
--              public.boost_tier, public.broadcast_kind;
-- alter table public.profiles drop column verified_contributor, drop column approved_posts;
