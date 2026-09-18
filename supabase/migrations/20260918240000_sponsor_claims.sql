-- ============================================================
-- Visit Klagon — owner claiming for business profiles.
--
-- Flow: signed-in member requests a claim on an unclaimed sponsor ->
-- admin approves -> sponsors.claimed_by links the owner, who can then
-- edit listing fields (photos, prices, amenities, hours, contact) but
-- NEVER tier/status/slug/claimed_by (trigger-enforced), reply to
-- reviews on their listing, and upload photos to sponsor-media.
-- ============================================================

-- ---------- claimed_by link ----------
alter table public.sponsors
  add column if not exists claimed_by uuid references public.profiles(id) on delete set null;

create index if not exists sponsors_claimed_by_idx on public.sponsors (claimed_by);

-- ---------- claim requests ----------
create table if not exists public.sponsor_claims (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  claimant_id uuid not null references public.profiles(id) on delete cascade,
  phone text,
  relationship text,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (sponsor_id, claimant_id)
);

alter table public.sponsor_claims enable row level security;

-- Claimants read their own requests.
drop policy if exists "sponsor_claims_read_own" on public.sponsor_claims;
create policy "sponsor_claims_read_own" on public.sponsor_claims
  for select to authenticated
  using (claimant_id = auth.uid());

-- Signed-in members file claims for themselves.
drop policy if exists "sponsor_claims_insert_self" on public.sponsor_claims;
create policy "sponsor_claims_insert_self" on public.sponsor_claims
  for insert to authenticated
  with check (claimant_id = auth.uid() and status = 'pending');

-- Admins full access.
drop policy if exists "sponsor_claims_admin_all" on public.sponsor_claims;
create policy "sponsor_claims_admin_all" on public.sponsor_claims
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- claimed-owner reads + edits ----------
-- Owners read their own row even before it is active.
drop policy if exists "sponsors_select_claimed" on public.sponsors;
create policy "sponsors_select_claimed" on public.sponsors
  for select to authenticated
  using (claimed_by = auth.uid());

-- Owners edit listing fields only (tier/status/slug/claimed_by locked
-- by the trigger below).
drop policy if exists "sponsors_update_claimed" on public.sponsors;
create policy "sponsors_update_claimed" on public.sponsors
  for update to authenticated
  using (claimed_by = auth.uid())
  with check (claimed_by = auth.uid());

create or replace function public.sponsors_guard_claimed_edit()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.is_admin() then
    return NEW;
  end if;
  if NEW.tier is distinct from OLD.tier
    or NEW.status is distinct from OLD.status
    or NEW.slug is distinct from OLD.slug
    or NEW.claimed_by is distinct from OLD.claimed_by
    or NEW.featured is distinct from OLD.featured then
    raise exception 'field locked for claimed owners';
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_sponsors_guard_claimed_edit on public.sponsors;
create trigger trg_sponsors_guard_claimed_edit
  before update on public.sponsors
  for each row execute function public.sponsors_guard_claimed_edit();

revoke execute on function public.sponsors_guard_claimed_edit() from anon, authenticated;

-- ---------- owner replies to reviews on their listing ----------
drop policy if exists "reviews_reply_owner" on public.reviews;
create policy "reviews_reply_owner" on public.reviews
  for update to authenticated
  using (
    status = 'approved'
    and exists (
      select 1 from public.sponsors s
      where s.id = reviews.sponsor_id and s.claimed_by = auth.uid()
    )
  )
  with check (
    status = 'approved'
    and exists (
      select 1 from public.sponsors s
      where s.id = reviews.sponsor_id and s.claimed_by = auth.uid()
    )
  );

-- ---------- sponsor-media bucket ----------
insert into storage.buckets (id, name, public)
values ('sponsor-media', 'sponsor-media', true)
on conflict (id) do nothing;

-- Public reads listing photos.
drop policy if exists "sponsor_media_read_public" on storage.objects;
create policy "sponsor_media_read_public" on storage.objects
  for select using (bucket_id = 'sponsor-media');

-- Claimed owners upload into their sponsor's folder only.
drop policy if exists "sponsor_media_insert_claimed" on storage.objects;
create policy "sponsor_media_insert_claimed" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'sponsor-media'
    and (storage.foldername(name))[1] = 'sponsors'
    and exists (
      select 1 from public.sponsors s
      where s.id::text = (storage.foldername(name))[2]
        and s.claimed_by = auth.uid()
    )
  );

-- Owners remove their own uploads.
drop policy if exists "sponsor_media_delete_claimed" on storage.objects;
create policy "sponsor_media_delete_claimed" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'sponsor-media'
    and (storage.foldername(name))[1] = 'sponsors'
    and exists (
      select 1 from public.sponsors s
      where s.id::text = (storage.foldername(name))[2]
        and s.claimed_by = auth.uid()
    )
  );
