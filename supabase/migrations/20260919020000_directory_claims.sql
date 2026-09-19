-- ============================================================
-- Directory listing claims — the 740 static listings in
-- src/data/business-directory.json, claimed by their owners.
--
-- Flow: anyone can start a claim (name + WhatsApp). The listing
-- then renders "Claim pending" instead of the claim buttons.
-- KlagonOrg staff verify via the claim's WhatsApp thread and flip
-- status -> 'approved' (in-app via an admin-write policy; the read
-- side is public). Approved listings render a "Claimed" badge and
-- the claim feature disappears. A 'rejected' row frees the slot so
-- the real owner can claim later.
-- ============================================================

create table if not exists public.directory_claims (
  id uuid primary key default gen_random_uuid(),
  business_id text not null,
  business_name text,
  area text,
  claimant_name text,
  claimant_phone text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One active claim per listing; rejected rows do not block a later claim.
create unique index if not exists directory_claims_active_business_key
  on public.directory_claims (business_id)
  where status <> 'rejected';

alter table public.directory_claims enable row level security;

-- Public: everyone can see the claimed state of any listing
-- (anon visitors hit /business and /directory/[slug]).
drop policy if exists "directory_claims_read_all" on public.directory_claims;
create policy "directory_claims_read_all" on public.directory_claims
  for select using (true);

-- Anyone may file a claim; it starts pending and staff approve it.
drop policy if exists "directory_claims_insert_pending" on public.directory_claims;
create policy "directory_claims_insert_pending" on public.directory_claims
  for insert to anon, authenticated
  with check (
    status = 'pending'
    and business_id is not null
    and claimant_name is not null and btrim(claimant_name) <> ''
    and claimant_phone is not null and btrim(claimant_phone) <> ''
  );

-- Staff/admin read/write full access (approve, reject, delete).
drop policy if exists "directory_claims_admin_all" on public.directory_claims;
create policy "directory_claims_admin_all" on public.directory_claims
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Staff flips status/idempotent touch on controlled transitions only.
drop policy if exists "directory_claims_update_admin" on public.directory_claims;
create policy "directory_claims_update_admin" on public.directory_claims
  for update to authenticated
  using (public.is_admin())
  with check (
    public.is_admin()
    and status in ('pending', 'approved', 'rejected')
  );

create index if not exists directory_claims_status_idx
  on public.directory_claims (status);