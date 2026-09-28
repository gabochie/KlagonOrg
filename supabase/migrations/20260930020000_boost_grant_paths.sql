-- ---------------------------------------------------------------------------
-- Make boosts fulfillable.
--
-- 20260930000000_boost_payment_gate.sql revoked purchase_boost from public,
-- anon and authenticated so a member could not grant themselves a free boost
-- by calling the RPC directly. That left the function with no caller: the
-- payment worker is the only intended caller, but its body still required
-- `submitted_by = auth.uid()`, and a service_role JWT carries no user id, so
-- auth.uid() is null and every worker call was rejected. Requests could be
-- taken and paid for but never applied.
--
-- This migration:
--   1. lets a service_role call through the ownership check, since the grant
--      list is the thing that authorises it (defence in depth: the check is
--      kept for every other role);
--   2. adds admin_apply_boost() so staff can apply a paid boost from the
--      dashboard during manual sales, which is how boosts are sold today.
--
-- The admin function deliberately takes no tier argument. The tier and the
-- price are both derived from the post, so staff cannot apply a premium tier
-- to a listing that is not eligible for it, and cannot set a fee.
-- ---------------------------------------------------------------------------

-- ------------------------------------------------------------------ 1. worker
create or replace function public.purchase_boost(p_post_id uuid, p_tier public.boost_tier)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_fee numeric;
  v_days int;
  v_service boolean := coalesce(auth.role(), '') = 'service_role';
begin
  select * into r from public.posts where id = p_post_id;
  -- The ownership rule still applies to everyone who is not the payment
  -- worker; only service_role (the sole execute grantee) may act for others.
  if r is null or (not v_service and r.submitted_by is distinct from auth.uid()) then
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

revoke execute on function public.purchase_boost(uuid, public.boost_tier) from public, anon, authenticated;
grant execute on function public.purchase_boost(uuid, public.boost_tier) to service_role;

-- ------------------------------------------------------------------ 2. staff
-- Manual sales: staff confirm payment on WhatsApp, then apply the boost here.
-- Gated on the same is_admin() that lets staff read lead_events, so the person
-- who can see the request is the person who can fulfil it.
create or replace function public.admin_apply_boost(p_post_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_fee numeric;
  v_days int;
  v_tier public.boost_tier;
begin
  if not public.is_admin() then
    return false;
  end if;

  select * into r from public.posts where id = p_post_id;
  if r is null then
    return false;
  end if;
  -- A boost on a listing that is not live would be invisible and un-refundable.
  if r.status <> 'approved' then
    return false;
  end if;
  -- Same guard as purchase_boost: do not stack or silently extend a live boost.
  if r.boost_until > now() then
    return false;
  end if;

  -- Tier and price derived from the post, never from the caller, so this
  -- cannot be used to grant an ineligible tier or an invented fee.
  if r.type = 'classified' and r.category in ('Properties', 'Auto') then
    v_tier := 'premium'; v_fee := 50; v_days := 7;
  else
    v_tier := 'featured';
    if r.type = 'classified' then
      v_fee := 20;
    else
      v_fee := 30;
    end if;
    v_days := 3;
  end if;

  update public.posts
    set boost_tier = v_tier,
        boost_fee_ghs = v_fee,
        boost_until = now() + (v_days || ' days')::interval,
        updated_at = now()
    where id = p_post_id;
  return true;
end; $$;

revoke execute on function public.admin_apply_boost(uuid) from public, anon;
grant execute on function public.admin_apply_boost(uuid) to authenticated;

comment on function public.purchase_boost(uuid, public.boost_tier) is
  'Worker-only: applies a boost after payment. Execute is granted to service_role alone.';
comment on function public.admin_apply_boost(uuid) is
  'Staff-only: applies the correct boost tier/fee for an approved post. Used for manual (WhatsApp-confirmed) sales.';
