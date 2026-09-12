-- Security-definer lookup for the payments worker's receipt emails.
-- Exposes only the columns the email templates need (no full table access for anon).
create or replace function public.get_donation_sendable(p_ref text)
returns table (email text, full_name text, amount_ghs numeric)
language sql
security definer
stable
as $$
  select email, full_name, amount_ghs
  from public.donations
  where provider_ref = p_ref
  limit 1;
$$;

revoke all on function public.get_donation_sendable(text) from public;
grant execute on function public.get_donation_sendable(text) to anon, authenticated, service_role;