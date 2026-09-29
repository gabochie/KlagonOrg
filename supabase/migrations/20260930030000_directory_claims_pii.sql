-- Directory claim PII lockdown.
--
-- Verified before writing this: an anonymous request with the public anon key
-- could read claimant_name and claimant_phone from public.directory_claims,
-- because directory_claims_read_all was `for select using (true)` and the anon
-- key ships in the client bundle. Anyone could dump the phone numbers of people
-- trying to claim their business listing.
--
-- The public claim badge still needs a runtime read, but only of two columns:
-- fetchDirectoryClaimMap() selects business_id and status and nothing else. So
-- the table read is reduced to exactly those columns for the public, and staff
-- get the full row through a gated SECURITY DEFINER function.

-- 1. Remove blanket table-level SELECT. Deliberately NOT `revoke all` on the
--    table: the anon INSERT privilege is what lets the public claim form work,
--    and the admin UPDATE/DELETE privileges are what the staff queue uses.
--
--    Every privilege this table needs is granted explicitly in step 2b below
--    rather than inherited from Supabase's blanket default grants on the public
--    schema. Relying on those defaults is what caused the first application of
--    this migration to leave the table with no INSERT grant at all, which broke
--    the public claim form for every visitor.
revoke select on public.directory_claims from anon, authenticated;

-- 2. Re-grant only the two non-PII columns the public badge needs.
grant select (business_id, status)
  on public.directory_claims to anon, authenticated;

-- 2b. Re-state the write privileges explicitly, because revoking above and
--     re-granting column by column is easy to get wrong by hand. RLS is what
--     actually constrains these: directory_claims_insert_pending allows only
--     status = 'pending', and the update/delete policies are gated on
--     is_admin(), so a member holding the UPDATE privilege still cannot touch
--     a single row.
grant insert on public.directory_claims to anon, authenticated;
grant update, delete on public.directory_claims to authenticated;

-- 3. RLS still has to admit that read. `authenticated` must stay in the role
--    list: column grants decide which COLUMNS are readable, RLS decides which
--    ROWS, so scoping this to anon alone would leave a signed-in member with
--    an empty claim map and every listing showing as unclaimed.
drop policy if exists "directory_claims_read_all" on public.directory_claims;
create policy "directory_claims_read_all" on public.directory_claims
  for select to anon, authenticated using (true);

-- 4. Staff need claimant_name and claimant_phone to verify ownership. Column
--    privileges are role-wide and an admin is also just `authenticated`, so a
--    plain grant would hand the phone number to every signed-up member.
--    SECURITY DEFINER reads as the owner, so the grants above do not apply,
--    and is_admin() is checked inside.
create or replace function public.admin_directory_claims()
returns table (
  id uuid,
  business_id text,
  business_name text,
  area text,
  claimant_name text,
  claimant_phone text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;
  return query
    select c.id, c.business_id, c.business_name, c.area,
           c.claimant_name, c.claimant_phone, c.status, c.created_at
    from public.directory_claims c
    order by (c.status <> 'pending'), c.created_at asc;
end;
$$;

-- 5. Default function privileges grant EXECUTE to public, which includes anon.
revoke all on function public.admin_directory_claims() from public;
grant execute on function public.admin_directory_claims() to authenticated;

-- 6. Deleting a claim needs the same treatment as reading one.
--
--    PostgREST returns the deleted row by default, so a DELETE against this
--    table requires SELECT on every column — including the PII the lockdown
--    just removed. `authenticated` therefore cannot delete a claim row by any
--    means, no matter which table privileges are granted to it. That is not
--    merely a testing inconvenience: moderation needs a way to remove a
--    fraudulent or duplicate claim, and without one the table fills with rows
--    that, because of the partial unique index on business_id where
--    status <> 'rejected', silently lock real businesses out of claiming
--    their own listing. That already happened once on this site.
--
--    Deletes by primary key only. No name or pattern matching is exposed here:
--    callers list the rows they want through admin_directory_claims() and pass
--    the ids back, so this function can only ever remove one specific row.
create or replace function public.admin_delete_directory_claim(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  if not public.is_admin() then
    raise exception 'not authorised' using errcode = '42501';
  end if;

  delete from public.directory_claims where id = p_id;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

revoke all on function public.admin_delete_directory_claim(uuid) from public;
grant execute on function public.admin_delete_directory_claim(uuid) to authenticated;
