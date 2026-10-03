-- ONE-TIME manual apply for Paid Boosts (Phase 3a).
-- How: Supabase Dashboard > SQL Editor > New query > paste this entire file > Run.
-- Do NOT move this file into supabase/migrations/.
-- Safe to re-run: every statement is idempotent.
-- Mirrors supabase/migrations/20260930050000_boost_payments.sql.
-- After running, deploy the worker (workers/moolre) so /api/boosts/charge exists.

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

drop policy if exists "boost_payments_insert_pending" on public.boost_payments;
create policy "boost_payments_insert_pending"
  on public.boost_payments for insert
  to anon, authenticated
  with check (status = 'pending' and fulfilled = false);

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

-- Sanity check: the helpers exist.
select proname
from pg_proc
where proname in ('boost_quote', 'apply_boost_grant', 'confirm_boost_payment_by_ref', 'get_boost_sendable')
order by proname;
