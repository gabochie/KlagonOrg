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

-- 1. Remove blanket table-level SELECT. Deliberately NOT `revoke all`: the anon
--    INSERT privilege is what lets the public claim form work, and the admin
--    UPDATE privileges are what the staff queue uses to approve or reject.
revoke select on public.directory_claims from anon, authenticated;

-- 2. Re-grant only the two non-PII columns the public badge needs.
grant select (business_id, status)
  on public.directory_claims to anon, authenticated;

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
