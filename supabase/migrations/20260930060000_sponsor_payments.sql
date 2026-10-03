-- ---------------------------------------------------------------------------
-- Sponsor payments: let a business pay for a sponsorship tier with MoMo.
--
-- Sponsorship was previously lead-capture only: /sponsor wrote a
-- sponsor_applications row and staff finalized the deal off-platform. This
-- adds a first-class paid order so the existing Moolre worker can charge and
-- confirm, while fulfilment stays a deliberate admin action (locked decision:
-- the admin "paid" queue promotes the partner; nothing auto-creates a sponsor).
--
-- Mirrors the donation/boost design: the worker holds only the anon key and
-- flips orders through SECURITY DEFINER RPCs keyed by an unguessable
-- provider_ref. No service_role key is needed on the worker.
--
-- Monthly pricing is derived server-side (sponsor_quote), never trusted from
-- the client, and the worker charges exactly that fee. Recurring billing is
-- intentionally NOT implemented: a charge covers one prepaid period (months).
-- ---------------------------------------------------------------------------

create table if not exists public.sponsor_payments (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.sponsor_applications(id) on delete set null,
  tier public.sponsor_tier not null,
  amount_ghs numeric(10,2) not null check (amount_ghs > 0),
  months int not null default 1 check (months > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  provider text not null default 'moolre',
  provider_ref text not null unique,
  payer_phone text,
  network text,
  metadata jsonb not null default '{}'::jsonb,
  promoted boolean not null default false,
  promoted_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists sponsor_payments_application_id_idx on public.sponsor_payments (application_id);
create index if not exists sponsor_payments_status_idx on public.sponsor_payments (status);

alter table public.sponsor_payments enable row level security;

-- The worker inserts with the anon key, so only unpaid rows are allowed.
drop policy if exists "sponsor_payments_insert_pending" on public.sponsor_payments;
create policy "sponsor_payments_insert_pending"
  on public.sponsor_payments for insert
  to anon, authenticated
  with check (status = 'pending' and promoted = false);

-- Admins read the orders to run the paid queue. There is no update/delete
-- policy: only the SECURITY DEFINER RPCs below mutate orders.
drop policy if exists "sponsor_payments_select_admin" on public.sponsor_payments;
create policy "sponsor_payments_select_admin"
  on public.sponsor_payments for select
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- sponsor_quote: the single server-side source of a sponsorship price.
-- Returns no rows for the bespoke Strategic tier (enquire off-platform) or an
-- unknown tier. The worker charges whatever this returns, so the browser
-- cannot negotiate the fee. months is clamped to a sane 1..12 prepaid window.
-- ---------------------------------------------------------------------------
create or replace function public.sponsor_quote(p_tier public.sponsor_tier, p_months int default 1)
returns table (tier public.sponsor_tier, fee_ghs numeric, months int)
language plpgsql security definer set search_path = public
as $$
declare
  v_monthly numeric;
  v_months int;
begin
  v_monthly := case p_tier
    when 'community' then 500
    when 'growth' then 2000
    when 'talent' then 5000
    when 'digital' then 10000
    else null
  end;

  -- 'strategic' is bespoke: no self-serve price.
  if v_monthly is null then
    return;
  end if;

  v_months := least(greatest(coalesce(p_months, 1), 1), 12);

  tier := p_tier;
  fee_ghs := v_monthly * v_months;
  months := v_months;
  return next;
end;
$$;

revoke all on function public.sponsor_quote(public.sponsor_tier, int) from public;
grant execute on function public.sponsor_quote(public.sponsor_tier, int) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- confirm_sponsor_payment_by_ref: what the Moolre worker calls. Idempotent:
-- only a pending order moves, and only to a terminal state. It does NOT create
-- or activate a sponsor: an admin promotes the partner from the paid queue.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_sponsor_payment_by_ref(p_ref text, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_status not in ('paid', 'failed') then
    return;
  end if;

  update public.sponsor_payments
    set status = p_status,
        paid_at = case when p_status = 'paid' then now() else paid_at end
    where provider_ref = p_ref
      and status = 'pending';
end;
$$;

revoke all on function public.confirm_sponsor_payment_by_ref(text, text) from public;
grant execute on function public.confirm_sponsor_payment_by_ref(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- mark_sponsor_payment_promoted: admin-only, idempotent. Called by the admin
-- queue after it promotes the linked application, so a paid order is not
-- actioned twice. Kept separate from promote_sponsor_application so the two
-- tables stay decoupled.
-- ---------------------------------------------------------------------------
create or replace function public.mark_sponsor_payment_promoted(p_ref text)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can mark sponsor payments promoted';
  end if;

  update public.sponsor_payments
    set promoted = true, promoted_at = now()
    where provider_ref = p_ref
      and status = 'paid'
      and promoted = false;
  return found;
end;
$$;

revoke all on function public.mark_sponsor_payment_promoted(text) from public;
grant execute on function public.mark_sponsor_payment_promoted(text) to authenticated;

-- ---------------------------------------------------------------------------
-- get_sponsor_sendable: minimal read used by the worker to build receipts and,
-- on OTP confirm, to look up the amount it must re-submit (never the client's).
-- ---------------------------------------------------------------------------
create or replace function public.get_sponsor_sendable(p_ref text)
returns table (
  org_name text,
  full_name text,
  email text,
  payer_phone text,
  amount_ghs numeric,
  tier text,
  months int
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
    select a.org_name, a.full_name, a.email, s.payer_phone, s.amount_ghs, s.tier::text, s.months
    from public.sponsor_payments s
    left join public.sponsor_applications a on a.id = s.application_id
    where s.provider_ref = p_ref;
end;
$$;

revoke all on function public.get_sponsor_sendable(text) from public;
grant execute on function public.get_sponsor_sendable(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- create_sponsor_order: the worker's single entry point. It derives the price,
-- records the application and the pending order atomically, and returns the
-- authoritative amount so the worker never trusts a client figure. A SECURITY
-- DEFINER function is used because anon cannot read back the inserted
-- application row (its SELECT policy is admin-only).
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

comment on table public.sponsor_payments is
  'Paid sponsor orders. Inserted pending by the Moolre worker (anon RLS); only confirm_sponsor_payment_by_ref mutates status. Promotion stays a manual admin action.';
comment on function public.sponsor_quote(public.sponsor_tier, int) is
  'Server-side sponsorship price; returns nothing for the bespoke Strategic tier.';
