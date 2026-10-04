-- ---------------------------------------------------------------------------
-- Payment confirm hardening: report transitions, unique donation refs, and
-- guard create_sponsor_order.
--
-- Follows 20261003070000_course_payments.sql, which added confirm_secret_ok()
-- to all four confirm_*_by_ref RPCs. This migration closes the three gaps that
-- left behind, none of which require a second payment provider to fix.
--
-- Design notes:
--  * TRANSITIONS ARE NOW REPORTED. The confirm RPCs returned void, so the
--    worker had no way to tell "this order just went pending -> paid" from
--    "this order was already paid". It therefore fired the receipt email on
--    every replayed callback, and reported settled: true for refs it had never
--    seen. They now return boolean: true only when a row actually moved. The
--    worker gates receipts on that.
--
--    Postgres will not change a return type via CREATE OR REPLACE, so each
--    function is dropped and recreated. Nothing in SQL calls these (they are
--    reached over PostgREST only), so plain DROP is enough — no CASCADE.
--
--  * DONATION REFS ARE NOW UNIQUE. boost/sponsor/course_payments all declare
--    `provider_ref text not null unique`; donations (20260912000000:201) was
--    left nullable and unconstrained, so confirm_donation_by_ref's
--    `where provider_ref = p_ref` would settle every row sharing a ref.
--
--  * create_sponsor_order IS NOW GUARDED. It is SECURITY DEFINER and granted to
--    anon, and it was the one order-creating RPC without a confirm_secret_ok()
--    check — create_course_order got one in the previous migration. It cannot
--    mark anything paid or grant a promotion (mark_sponsor_payment_promoted is
--    admin-only and requires status = 'paid'), so the exposure was limited to
--    creating pending orders, i.e. spam in the sponsorship queue. Closed anyway
--    because it is free to close.
--
-- NOT a behavioural change for legitimate callers: the worker sends the same
-- x-confirm-secret header it already sends to every confirm RPC.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. donations.provider_ref must be unique.
--
-- Guarded rather than bare: an unconditional CREATE UNIQUE INDEX would abort
-- the whole migration if production ever holds two pending rows sharing a ref,
-- and supabase db push runs this on every push to main. Multiple NULLs are
-- allowed by a unique index, so the many unpaid rows are not a problem.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from public.donations
    where provider_ref is not null
    group by provider_ref
    having count(*) > 1
  ) then
    raise exception
      'donations.provider_ref has duplicates; resolve them before creating the unique index';
  end if;
end;
$$;

create unique index if not exists donations_provider_ref_key
  on public.donations (provider_ref);

-- ---------------------------------------------------------------------------
-- 2. Guard create_sponsor_order.
-- ---------------------------------------------------------------------------
create or replace function public.create_sponsor_order(
  p_tier public.sponsor_tier,
  p_full_name text,
  p_org_name text,
  p_email text,
  p_phone text,
  p_network text,
  p_provider_ref text,
  p_message text default null
)
returns table (provider_ref text, amount_ghs numeric, months int, tier public.sponsor_tier)
language plpgsql security definer set search_path = public
as $$
declare
  v_app_id uuid;
  v_quote record;
  v_ref text;
begin
  -- Body below is 20260930060000_sponsor_payments.sql:200-238 verbatim; the
  -- only addition is this guard.
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if coalesce(trim(p_full_name), '') = '' then
    raise exception 'name-required' using errcode = '22023';
  end if;

  select * into v_quote from public.sponsor_quote(p_tier, 1);
  if v_quote is null then
    raise exception 'tier-not-payable' using errcode = '22023';
  end if;

  v_ref := nullif(trim(p_provider_ref), '');
  if v_ref is null then
    raise exception 'ref-required' using errcode = '22023';
  end if;

  insert into public.sponsor_applications (org_name, full_name, phone, email, plan_id, message, status)
  values (
    nullif(trim(p_org_name), ''),
    trim(p_full_name),
    p_phone,
    nullif(trim(p_email), ''),
    p_tier::text,
    p_message,
    'pending'
  )
  returning id into v_app_id;

  insert into public.sponsor_payments (
    application_id, tier, amount_ghs, months, status, provider, provider_ref, payer_phone, network
  ) values (
    v_app_id, p_tier, v_quote.fee_ghs, v_quote.months, 'pending', 'moolre', v_ref, p_phone, p_network
  );

  provider_ref := v_ref;
  amount_ghs := v_quote.fee_ghs;
  months := v_quote.months;
  tier := p_tier;
  return next;
end;
$$;

revoke all on function public.create_sponsor_order(public.sponsor_tier, text, text, text, text, text, text, text) from public;
grant execute on function public.create_sponsor_order(public.sponsor_tier, text, text, text, text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. confirm_*_by_ref now return whether a row moved.
--
-- True  = this call transitioned a pending row to p_status.
-- False = no such pending row (already terminal, or unknown ref) — or the
--         status was not paid/failed, in which case nothing is attempted.
--
-- Side effects are unchanged and still fire exactly once, because they remain
-- inside the "o is not null" branch.
-- ---------------------------------------------------------------------------
drop function if exists public.confirm_donation_by_ref(text, text);
drop function if exists public.confirm_boost_payment_by_ref(text, text);
drop function if exists public.confirm_sponsor_payment_by_ref(text, text);
drop function if exists public.confirm_course_payment_by_ref(text, text);

create or replace function public.confirm_donation_by_ref(p_ref text, p_status text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  o record;
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_status not in ('paid', 'failed') then
    return false;
  end if;

  -- Shaped like confirm_boost_payment_by_ref: test the record with `o is null`
  -- rather than `o is not null`. An UPDATE that matches no rows leaves the record
  -- unset, and that is the comparison this schema already runs in production.
  update public.donations
  set status = p_status::public.donation_status,
      paid_at = case when p_status = 'paid' then now() else paid_at end
  where provider_ref = p_ref
    and status = 'pending'
  returning * into o;

  if o is null then
    return false;
  end if;

  return true;
end;
$$;

create or replace function public.confirm_boost_payment_by_ref(p_ref text, p_status text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  o record;
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_status not in ('paid', 'failed') then
    return false;
  end if;

  update public.boost_payments
    set status = p_status,
        paid_at = case when p_status = 'paid' then now() else paid_at end
    where provider_ref = p_ref
      and status = 'pending'
    returning * into o;

  if o is null then
    return false;
  end if;

  if p_status = 'paid'
     and public.apply_boost_grant(o.post_id, o.tier, o.amount_ghs, o.days) then
    update public.boost_payments
      set fulfilled = true, fulfilled_at = now()
      where id = o.id;
  end if;

  return true;
end;
$$;

create or replace function public.confirm_sponsor_payment_by_ref(p_ref text, p_status text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  o record;
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_status not in ('paid', 'failed') then
    return false;
  end if;

  update public.sponsor_payments
    set status = p_status,
        paid_at = case when p_status = 'paid' then now() else paid_at end
    where provider_ref = p_ref
      and status = 'pending'
  returning * into o;

  if o is null then
    return false;
  end if;

  return true;
end;
$$;

create or replace function public.confirm_course_payment_by_ref(p_ref text, p_status text)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  o record;
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_status not in ('paid', 'failed') then
    return false;
  end if;

  update public.course_payments
    set status = p_status,
        paid_at = case when p_status = 'paid' then now() else paid_at end
    where provider_ref = p_ref
      and status = 'pending'
    returning * into o;

  if o is null then
    return false;
  end if;

  if p_status = 'paid'
     and public.grant_course_access(o.course_id, o.member_id, o.id) then
    update public.course_payments
      set fulfilled = true, fulfilled_at = now()
      where id = o.id;
  end if;

  return true;
end;
$$;

revoke all on function public.confirm_donation_by_ref(text, text) from public;
revoke all on function public.confirm_boost_payment_by_ref(text, text) from public;
revoke all on function public.confirm_sponsor_payment_by_ref(text, text) from public;
revoke all on function public.confirm_course_payment_by_ref(text, text) from public;

grant execute on function public.confirm_donation_by_ref(text, text) to anon, authenticated;
grant execute on function public.confirm_boost_payment_by_ref(text, text) to anon, authenticated;
grant execute on function public.confirm_sponsor_payment_by_ref(text, text) to anon, authenticated;
grant execute on function public.confirm_course_payment_by_ref(text, text) to anon, authenticated;