-- ============================================================
-- KlagonOrg — donation confirmation RPC for the Moolre worker
-- Lets the Cloudflare Worker flip a pending donation to paid /
-- failed using only the anon key. SECURITY DEFINER runs as owner
-- (bypasses RLS); the provider_ref is an unguessable externalref
-- and the Worker additionally gates callers by callback secret.
-- Only pending -> terminal transitions are allowed (idempotent).
-- ============================================================

create or replace function public.confirm_donation_by_ref(p_ref text, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_status not in ('paid', 'failed') then
    return;
  end if;
  update public.donations
  set status = p_status::public.donation_status,
      paid_at = case when p_status = 'paid' then now() else paid_at end
  where provider_ref = p_ref
    and status = 'pending';
end;
$$;

revoke all on function public.confirm_donation_by_ref(text, text) from public;
grant execute on function public.confirm_donation_by_ref(text, text) to anon, authenticated;