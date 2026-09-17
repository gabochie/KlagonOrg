-- ============================================================
-- KLAGON Sponsorship — Phase 1 sponsor platform
-- sponsors, sponsor_badges, business_cards, templates, template_downloads
-- + RLS + seed data + promote_sponsor_application RPC
-- ============================================================

-- ---------- enums ----------
create type public.sponsor_tier as enum ('community', 'growth', 'talent', 'digital', 'strategic');
create type public.sponsor_status as enum ('pending', 'active', 'paused');
create type public.wall_group as enum ('founding', 'strategic', 'innovation', 'skills', 'community', 'business');
create type public.badge_type as enum ('verified', 'sponsor', 'community_partner', 'skills_partner', 'innovation_partner', 'youth_employer', 'impact_partner');

-- ---------- sponsors ----------
create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  tier public.sponsor_tier not null,
  status public.sponsor_status not null default 'pending',
  wall_group public.wall_group,
  featured boolean not null default false,
  name text not null,
  tagline text,
  logo_url text,
  cover_url text,
  about text,
  why_supports text,
  categories text[] not null default '{}',
  products_services text[] not null default '{}',
  contact jsonb not null default '{}'::jsonb,
  location jsonb not null default '{}'::jsonb,
  opening_hours text,
  service_areas text[] not null default '{}',
  certifications text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsors_featured_strategic_only check (featured = false or tier = 'strategic')
);

create or replace function public.set_sponsor_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_sponsors_updated_at
  before update on public.sponsors
  for each row execute function public.set_sponsor_updated_at();

-- ---------- sponsor_badges ----------
create table public.sponsor_badges (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  tier_type public.badge_type not null,
  awarded_at timestamptz not null default now(),
  unique (sponsor_id, tier_type)
);

-- ---------- business_cards ----------
create table public.business_cards (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- templates ----------
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  industry_tag text,
  description text,
  file_url text not null,
  min_tier public.sponsor_tier not null default 'community',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- template_downloads ----------
create table public.template_downloads (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates(id) on delete cascade,
  sponsor_id uuid references public.sponsors(id) on delete set null,
  downloaded_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table public.sponsors enable row level security;
alter table public.sponsor_badges enable row level security;
alter table public.business_cards enable row level security;
alter table public.templates enable row level security;
alter table public.template_downloads enable row level security;

create policy "sponsors_read_active" on public.sponsors
  for select using (status = 'active');

create policy "sponsors_admin_all" on public.sponsors
  for all using (public.is_admin()) with check (public.is_admin());

create policy "sponsor_badges_read_active" on public.sponsor_badges
  for select using (exists (
    select 1 from public.sponsors s where s.id = sponsor_badges.sponsor_id and s.status = 'active'
  ));

create policy "sponsor_badges_admin_all" on public.sponsor_badges
  for all using (public.is_admin()) with check (public.is_admin());

create policy "business_cards_read_active" on public.business_cards
  for select using (exists (
    select 1 from public.sponsors s where s.id = business_cards.sponsor_id and s.status = 'active'
  ));

create policy "business_cards_admin_all" on public.business_cards
  for all using (public.is_admin()) with check (public.is_admin());

create policy "templates_read_public" on public.templates
  for select using (true);

create policy "templates_admin_all" on public.templates
  for all using (public.is_admin()) with check (public.is_admin());

create policy "template_downloads_admin_select" on public.template_downloads
  for select using (public.is_admin());

create policy "template_downloads_admin_write" on public.template_downloads
  for insert with check (public.is_admin());

-- ---------- promote_sponsor_application ----------
-- Single admin command: mark application approved + create sponsor (active)
-- + business card + verified badge, atomically.
create or replace function public.promote_sponsor_application(
  p_application_id uuid,
  p_slug text,
  p_tier public.sponsor_tier,
  p_name text,
  p_tagline text default null,
  p_logo_url text default null,
  p_cover_url text default null,
  p_about text default null,
  p_why_supports text default null,
  p_categories text[] default null,
  p_products_services text[] default null,
  p_contact jsonb default null,
  p_location jsonb default null,
  p_opening_hours text default null,
  p_service_areas text[] default null,
  p_certifications text[] default null,
  p_wall_group public.wall_group default null,
  p_featured boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sponsor_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can promote sponsor applications';
  end if;

  insert into public.sponsors (
    slug, tier, status, wall_group, featured, name, tagline, logo_url, cover_url,
    about, why_supports, categories, products_services, contact, location,
    opening_hours, service_areas, certifications
  ) values (
    p_slug, p_tier, 'active', p_wall_group, p_featured, p_name, p_tagline, p_logo_url, p_cover_url,
    p_about, p_why_supports, coalesce(p_categories, '{}'), coalesce(p_products_services, '{}'),
    coalesce(p_contact, '{}'::jsonb), coalesce(p_location, '{}'::jsonb),
    p_opening_hours, coalesce(p_service_areas, '{}'), coalesce(p_certifications, '{}')
  )
  returning id into v_sponsor_id;

  insert into public.business_cards (sponsor_id, slug) values (v_sponsor_id, p_slug);

  insert into public.sponsor_badges (sponsor_id, tier_type)
  values (v_sponsor_id, 'verified');

  update public.sponsor_applications
  set status = 'approved'
  where id = p_application_id;

  perform public.log_audit('sponsor_promote', 'sponsors', v_sponsor_id::text,
    jsonb_build_object('application_id', p_application_id, 'tier', p_tier::text));

  return v_sponsor_id;
end;
$$;

grant execute on function public.promote_sponsor_application to authenticated;

-- ============================================================
-- Seed data (3 sample active sponsors + 10 templates)
-- ============================================================

insert into public.sponsors (
  slug, tier, status, wall_group, featured, name, tagline, about, why_supports,
  categories, products_services, contact, location, opening_hours, service_areas, certifications
) values
(
  'afram-plains-engineering',
  'strategic', 'active', 'strategic', true,
  'Afram Plains Engineering',
  'Civil & infrastructure partner building Klagon''s future',
  'Afram Plains Engineering is a full-service civil and infrastructure firm delivering roads, drainage, and community buildings across the Greater Accra Region. We exist to build the physical foundations that help communities like Klagon grow.',
  'We sponsor KLAGON because the next generation of engineers and site managers will come from the young people of this community. Supporting KLAGON means investing in the skilled workforce we will hire tomorrow.',
  array['Engineering', 'Construction', 'Infrastructure'],
  array['Road & drainage construction', 'Community housing', 'Site surveying', 'Apprenticeship placements'],
  '{"phone": "+233 30 000 0001", "whatsapp": "+233300000001", "email": "hello@aframplainsgh.com", "website": "https://aframplainsgh.com", "social": {"facebook": "https://facebook.com/aframplains", "instagram": "https://instagram.com/aframplains"}}'::jsonb,
  '{"area": "Klagon, Tema West", "address": "Plot 4, Industrial Road, Klagon", "google_maps_url": "https://maps.google.com/?q=Klagon"}'::jsonb,
  'Mon – Fri: 8:00am – 5:00pm; Sat: 9:00am – 1:00pm',
  array['Klagon', 'Lashibi', 'Tema', 'Ashaiman'],
  array['Ghanaian Building & Road Research Institute (GBBRI)', 'GHIPOA Member']
),
(
  'tema-digital-hub',
  'growth', 'active', 'business', false,
  'Tema Digital Hub',
  'Workspace, wifi and digital skills for growing businesses',
  'Tema Digital Hub provides modern co-working space, high-speed internet, and practical digital skills training for SMEs across Tema and its environs. From bookkeeping apps to WhatsApp marketing, we help small businesses go digital.',
  'We partner with KLAGON because a digitally capable generation is the fastest way to grow opportunity in Klagon. KLAGON''s young members are exactly the workforce our member businesses need.',
  array['Technology', 'Co-working', 'Training'],
  array['Co-working memberships', 'Meeting rooms & event space', 'Digital skills workshops', 'Business internet plans'],
  '{"phone": "+233 30 000 0002", "whatsapp": "+233300000002", "email": "info@temadigitalhub.com", "website": "https://temadigitalhub.com"}'::jsonb,
  '{"area": "Community Road, Tema", "address": "2nd Floor, Community One Plaza, Tema", "google_maps_url": "https://maps.google.com/?q=Tema+Community+1"}'::jsonb,
  'Open daily: 7:00am – 9:00pm',
  array['Tema Community 1', 'Tema Community 2', 'Klagon', 'Spintex'],
  array['Ghana Chamber of Commerce Member']
),
(
  'klagon-community-bakery',
  'community', 'active', 'community', false,
  'Klagon Community Bakery',
  'Fresh daily bread, made by Klagon hands',
  'Klagon Community Bakery has been serving fresh bread, pastries, and event cakes to Klagon families for over a decade. Every loaf is baked by a local team that includes KLAGON alumni.',
  'We support KLAGON because our own bakers were once young people looking for a first chance. KLAGON gives Klagon youth the skills and confidence to take it.',
  array['Food & Beverage', 'Retail'],
  array['Fresh bread & pastries', 'Cakes for events', 'Bulk supply to schools & chop bars'],
  '{"phone": "+233 30 000 0003", "whatsapp": "+233300000003", "email": "hello@klagonbakery.com", "website": "https://klagonbakery.com", "social": {"instagram": "https://instagram.com/klagonbakery"}}'::jsonb,
  '{"area": "Klagon Central", "address": "Market Road, Klagon Central", "google_maps_url": "https://maps.google.com/?q=Klagon+Market"}'::jsonb,
  'Mon – Sat: 5:30am – 6:00pm; Sun: 6:30am – 1:00pm',
  array['Klagon', 'Lashibi'],
  array['Food Safety & Hygiene Certification (FDA-Ghana)']
);

insert into public.sponsor_badges (sponsor_id, tier_type)
select s.id, 'impact_partner' from public.sponsors s where s.slug = 'afram-plains-engineering';

insert into public.sponsor_badges (sponsor_id, tier_type)
select s.id, 'skills_partner' from public.sponsors s where s.slug = 'tema-digital-hub';

insert into public.sponsor_badges (sponsor_id, tier_type)
select s.id, 'community_partner' from public.sponsors s where s.slug = 'klagon-community-bakery';

insert into public.business_cards (sponsor_id, slug)
select s.id, s.slug from public.sponsors s;

-- ---------- templates seed (10) ----------
insert into public.templates (title, category, industry_tag, description, file_url, min_tier, sort_order) values
('Simple Invoice', 'Finance', 'All industries', 'A clean, professional invoice with line items, totals, and payment terms.', '/templates/finance-invoice.html', 'community', 1),
('Sales Quotation', 'Sales', 'All industries', 'A one-page quotation you can customise and send to a customer in minutes.', '/templates/sales-quotation.html', 'community', 2),
('Contract Checklist', 'Operations', 'All industries', 'The key clauses every Ghanaian SME contract should cover before you sign.', '/templates/ops-contract-checklist.html', 'community', 3),
('Job Description', 'People', 'All industries', 'A ready-to-edit job description template for your next hire.', '/templates/people-job-description.html', 'community', 4),
('Content Calendar', 'Marketing', 'All industries', 'Plan a month of social media and WhatsApp posts in one sheet.', '/templates/marketing-content-calendar.html', 'community', 5),
('Cash Flow Tracker', 'Finance', 'All industries', 'Track weekly income, expenses, and cash position for your business.', '/templates/finance-cash-flow.html', 'growth', 6),
('Business Proposal', 'Sales', 'All industries', 'A persuasive project or product proposal aligned to customer pain points.', '/templates/sales-proposal.html', 'growth', 7),
('SOP Template', 'Operations', 'All industries', 'Document your standard operating procedures so the business runs without you.', '/templates/ops-sop.html', 'growth', 8),
('Interview Scorecard', 'People', 'All industries', 'Score every candidate on the same criteria to hire fairly and consistently.', '/templates/people-interview-scorecard.html', 'growth', 9),
('Business Plan Outline', 'Strategy', 'All industries', 'A practical outline to capture your model, market, operations, and finances.', '/templates/strategy-business-plan.html', 'growth', 10);