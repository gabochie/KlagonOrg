-- ============================================================
-- KlagonStudios — initial schema
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- enums ----------
create type public.user_role as enum ('member', 'admin', 'super_admin');
create type public.member_status as enum ('pending', 'approved', 'rejected');
create type public.event_type as enum ('workshop', 'hackathon', 'leadership', 'service');
create type public.donation_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.project_status as enum ('active', 'recruiting', 'completed');
create type public.news_category as enum ('Programs', 'Events', 'Community', 'Environment', 'Partnerships');

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null,
  email text not null,
  age int check (age >= 5 and age <= 120),
  occupation text,
  gender text check (gender in ('male', 'female', 'other')),
  interests text[] default '{}',
  career_goal text,
  role public.user_role not null default 'member',
  status public.member_status not null default 'pending',
  xp int not null default 0,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- events ----------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type public.event_type not null,
  description text,
  date date not null,
  time text not null,
  location text,
  spots int not null default 0,
  published boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, member_id)
);

-- ---------- learning ----------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  icon text not null default '📚',
  description text,
  lessons_count_check boolean generated always as (true) stored,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  duration_min int default 10,
  content_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (course_id, sort_order)
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (member_id, lesson_id)
);

-- ---------- badges ----------
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text not null default '🌟'
);

create table public.member_badges (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique (member_id, badge_id)
);

-- ---------- projects ----------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text not null default '🌳',
  status public.project_status not null default 'active',
  volunteers_target int not null default 0,
  progress int not null default 0 check (progress between 0 and 100),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.project_volunteers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (project_id, member_id)
);

-- ---------- news & announcements ----------
create table public.news_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  body text,
  category public.news_category not null default 'Community',
  author uuid references public.profiles(id) on delete set null,
  author_name text,
  image_url text,
  read_time_min int default 2,
  published boolean not null default true,
  published_at timestamptz not null default now()
);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  pin_until timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- outreach & money ----------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  phone text,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz not null default now()
);

create table public.mentor_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text not null,
  profession text,
  topics text[] default '{}',
  motivation text,
  status public.member_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.volunteer_signups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  member_id uuid references public.profiles(id) on delete set null,
  full_name text,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

create table public.sponsor_applications (
  id uuid primary key default gen_random_uuid(),
  org_name text,
  full_name text not null,
  phone text not null,
  email text not null,
  plan_id text,
  message text,
  status public.member_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  amount_ghs numeric(10,2) not null check (amount_ghs > 0),
  tier_id text,
  full_name text,
  phone text,
  email text,
  status public.donation_status not null default 'pending',
  provider text not null default 'moolre',
  provider_ref text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

-- ---------- audit ----------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  detail jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- triggers ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- ---------- helper auth functions ----------
create or replace function public.current_role()
returns public.user_role
language sql stable
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'member'::public.user_role);
$$;

create or replace function public.is_approved_member()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;