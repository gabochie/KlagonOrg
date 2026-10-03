-- ---------------------------------------------------------------------------
-- Boost payments: let a member pay for a featured placement with MoMo.
--
-- Boosts were previously lead-capture only: BoostRequestPanel wrote a
-- lead_events row and staff applied the boost after a WhatsApp-confirmed
-- payment (see 20260930020000_boost_grant_paths.sql / admin_apply_boost). This
-- adds a first-class paid order so the existing Moolre worker can charge,
-- confirm and apply the boost end to end.
--
-- Mirrors the donation design (20260912000400_donation_confirm_rpc.sql): the
-- worker holds only the anon key and flips orders through SECURITY DEFINER
-- RPCs keyed by an unguessable provider_ref. No service_role key is needed on
-- the worker.
--
-- Pricing is derived server-side from the post (boost_quote), never trusted
-- from the client, and the worker charges exactly that fee.
-- ---------------------------------------------------------------------------

create table if not exists public.boost_payments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  tier public.boost_tier not null,
  amount_ghs numeric(10,2) not null check (amount_ghs > 0),
  days int not null check (days > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  provider text not null default 'moolre',
  provider_ref text not null unique,
  payer_phone text,
  network text,
  metadata jsonb not null default '{}'::jsonb,
  fulfilled boolean not null default false,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists boost_payments_post_id_idx on public.boost_payments (post_id);
create index if not exists boost_payments_status_idx on public.boost_payments (status);

alter table public.boost_payments enable row level security;

-- The worker inserts with the anon key, so only unpaid rows are allowed.
drop policy if exists "boost_payments_insert_pending" on public.boost_payments;
create policy "boost_payments_insert_pending"
  on public.boost_payments for insert
  to anon, authenticated
  with check (status = 'pending' and fulfilled = false);

-- Owners read the orders for their own posts; admins read all. There is no
-- update/delete policy: only the SECURITY DEFINER RPCs below mutate orders.
drop policy if exists "boost_payments_select_own_or_admin" on public.boost_payments;
create policy "boost_payments_select_own_or_admin"
  on public.boost_payments for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.posts p
      where p.id = boost_payments.post_id and p.submitted_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- boost_quote: the single server-side source of the boost price for a post.
-- Returns no rows when the listing is not boostable (not approved, or already
-- boosted). The worker charges whatever this returns, so the browser cannot
-- negotiate the fee.
-- ---------------------------------------------------------------------------
create or replace function public.boost_quote(p_post_id uuid)
returns table (tier public.boost_tier, fee_ghs numeric, days int)
language plpgsql security definer set search_path = public
as $$
declare
  r record;
begin
  select * into r from public.posts where id = p_post_id;
  if r is null or r.status <> 'approved' or r.boost_until > now() then
    return;
  end if;

  if r.type = 'classified' and r.category in ('Properties', 'Auto') then
    tier := 'premium'; fee_ghs := 50; days := 7;
  elsif r.type = 'classified' then
    tier := 'featured'; fee_ghs := 20; days := 3;
  else
    tier := 'featured'; fee_ghs := 30; days := 3;
  end if;

  return next;
end;
$$;

revoke all on function public.boost_quote(uuid) from public;
grant execute on function public.boost_quote(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- apply_boost_grant: internal, ungranted helper. Applies the boost only while
-- the post is still eligible, so a paid order can never stack or extend a live
-- boost. Called by confirm_boost_payment_by_ref.
-- ---------------------------------------------------------------------------
create or replace function public.apply_boost_grant(
  p_post_id uuid, p_tier public.boost_tier, p_fee numeric, p_days int
)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  update public.posts
    set boost_tier = p_tier,
        boost_fee_ghs = p_fee,
        boost_until = now() + (p_days || ' days')::interval,
        updated_at = now()
    where id = p_post_id
      and status = 'approved'
      and boost_until <= now();
  return found;
end;
$$;

revoke all on function public.apply_boost_grant(uuid, public.boost_tier, numeric, int) from public;

-- ---------------------------------------------------------------------------
-- confirm_boost_payment_by_ref: what the Moolre worker calls. Idempotent:
-- only a pending order moves, and only to a terminal state. On 'paid' it also
-- applies the boost, so a confirmed payment always grants the placement.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_boost_payment_by_ref(p_ref text, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  o record;
begin
  if p_status not in ('paid', 'failed') then
    return;
  end if;

  update public.boost_payments
    set status = p_status,
        paid_at = case when p_status = 'paid' then now() else paid_at end
    where provider_ref = p_ref
      and status = 'pending'
    returning * into o;

  -- Already terminal, or unknown ref: nothing to do.
  if o is null then
    return;
  end if;

  if p_status = 'paid'
     and public.apply_boost_grant(o.post_id, o.tier, o.amount_ghs, o.days) then
    update public.boost_payments
      set fulfilled = true, fulfilled_at = now()
      where id = o.id;
  end if;
end;
$$;

revoke all on function public.confirm_boost_payment_by_ref(text, text) from public;
grant execute on function public.confirm_boost_payment_by_ref(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_boost_sendable: minimal read used by the worker to build receipts and,
-- on OTP confirm, to look up the amount it must re-submit (never the client's).
-- ---------------------------------------------------------------------------
create or replace function public.get_boost_sendable(p_ref text)
returns table (post_title text, amount_ghs numeric, payer_phone text, tier text, days int)
language plpgsql security definer set search_path = public
as $$
begin
  return query
    select p.title, b.amount_ghs, b.payer_phone, b.tier::text, b.days
    from public.boost_payments b
    join public.posts p on p.id = b.post_id
    where b.provider_ref = p_ref;
end;
$$;

revoke all on function public.get_boost_sendable(text) from public;
grant execute on function public.get_boost_sendable(text) to anon, authenticated;

comment on table public.boost_payments is
  'Paid boost orders. Inserted pending by the Moolre worker (anon RLS); only confirm_boost_payment_by_ref mutates status.';
comment on function public.boost_quote(uuid) is
  'Server-side boost price for a post; returns nothing when the listing cannot be boosted.';
