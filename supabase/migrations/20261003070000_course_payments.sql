-- ---------------------------------------------------------------------------
-- Paid courses (one-time, lifetime access) + confirm-secret hardening.
--
-- Courses were free (see 20260912000000_initial_schema.sql: courses has no
-- price). This adds an optional per-course price and a paid order/entitlement
-- pair so the existing Moolre worker can charge and grant access end to end.
--
-- Design notes:
--  * The site is a static export, so paid lesson content must never be baked
--    into the build. Instead lessons_read_public is tightened so a paid
--    course's lessons are only selectable by an entitled member (or admin).
--    The reader renders paid courses client-side behind that gate.
--  * Pricing is derived server-side (course_quote) and the buyer must be
--    signed in; the worker verifies the Supabase access token and records the
--    member id, so a purchase always attaches to a real auth.uid().
--  * HARDENING: every confirm_*_by_ref RPC now requires a worker-only shared
--    secret (header x-confirm-secret) verified by confirm_secret_ok(). The
--    refs are unguessable, but callers could still self-confirm a pending
--    order; the secret closes that. The secret is generated here and must be
--    copied into the worker (wrangler secret CONFIRM_SECRET).
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. courses.price_ghs — null/0 means free.
-- ---------------------------------------------------------------------------
alter table public.courses add column if not exists price_ghs numeric(10,2);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'courses_price_ghs_check'
  ) then
    alter table public.courses
      add constraint courses_price_ghs_check check (price_ghs is null or price_ghs > 0);
  end if;
end $$;

-- courses_public gains the price so the public hub can show Free / GH₵.
--
-- NOTE: CREATE OR REPLACE VIEW matches columns by position, so the existing
-- columns keep their exact order (id..created_at, lesson_count, cover_url) and
-- price_ghs is appended LAST. The view is security_invoker, and lessons are now
-- RLS-gated for paid courses, so the count comes from a SECURITY DEFINER
-- aggregate instead of a join (the join would read 0 for non-entitled callers).
create or replace function public.course_lesson_count(p_course_id uuid)
returns int
language sql stable security definer set search_path = public
as $$
  select count(*)::int from public.lessons where course_id = p_course_id;
$$;

revoke all on function public.course_lesson_count(uuid) from public;
grant execute on function public.course_lesson_count(uuid) to anon, authenticated;

create or replace view public.courses_public as
select
  c.id,
  c.title,
  c.category,
  c.icon,
  c.description,
  c.created_at,
  public.course_lesson_count(c.id) as lesson_count,
  c.cover_url,
  c.price_ghs
from public.courses c
where c.published = true
order by c.created_at asc;

alter view public.courses_public set (security_invoker = true);
grant select on public.courses_public to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Worker-only confirm secret. Stored with RLS on and no policies, so only
--    SECURITY DEFINER functions (owner, bypasses RLS) can read it.
-- ---------------------------------------------------------------------------
create table if not exists public.app_secrets (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now()
);

alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

-- Seed a random secret once. Copy this value into the worker:
--   select value from public.app_secrets where key = 'confirm_secret';
--   npx wrangler secret put CONFIRM_SECRET   (paste the value)
insert into public.app_secrets (key, value)
select 'confirm_secret',
       replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
where not exists (select 1 from public.app_secrets where key = 'confirm_secret');

create or replace function public.confirm_secret_ok()
returns boolean
language plpgsql stable security definer set search_path = public
as $$
declare
  hdrs json;
  sent text;
  expected text;
begin
  begin
    hdrs := current_setting('request.headers', true)::json;
  exception when others then
    hdrs := null;
  end;

  sent := nullif(hdrs->>'x-confirm-secret', '');
  if sent is null then
    return false;
  end if;

  select value into expected from public.app_secrets where key = 'confirm_secret';
  return expected is not null and sent = expected;
end;
$$;

revoke all on function public.confirm_secret_ok() from public;

-- ---------------------------------------------------------------------------
-- 3. course_payments — one paid order per attempted purchase.
-- ---------------------------------------------------------------------------
create table if not exists public.course_payments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  member_id uuid references public.profiles(id) on delete set null,
  amount_ghs numeric(10,2) not null check (amount_ghs > 0),
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

create index if not exists course_payments_course_id_idx on public.course_payments (course_id);
create index if not exists course_payments_member_id_idx on public.course_payments (member_id);
create index if not exists course_payments_status_idx on public.course_payments (status);

alter table public.course_payments enable row level security;

-- Only the SECURITY DEFINER create_course_order inserts, so there is no insert
-- policy. Buyers read their own orders; admins read all.
drop policy if exists "course_payments_select_own_or_admin" on public.course_payments;
create policy "course_payments_select_own_or_admin"
  on public.course_payments for select
  to authenticated
  using (public.is_admin() or member_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 4. course_entitlements — lifetime access, one row per member/course.
-- ---------------------------------------------------------------------------
create table if not exists public.course_entitlements (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  payment_id uuid references public.course_payments(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (member_id, course_id)
);

create index if not exists course_entitlements_member_id_idx on public.course_entitlements (member_id);
create index if not exists course_entitlements_course_id_idx on public.course_entitlements (course_id);

alter table public.course_entitlements enable row level security;

-- Members read their own entitlements; admins read all. No write policy: only
-- grant_course_access (SECURITY DEFINER) writes.
drop policy if exists "course_entitlements_select_own_or_admin" on public.course_entitlements;
create policy "course_entitlements_select_own_or_admin"
  on public.course_entitlements for select
  to authenticated
  using (public.is_admin() or member_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 5. has_course_access — used by the lessons RLS policy and the reader gate.
-- ---------------------------------------------------------------------------
create or replace function public.has_course_access(p_course_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.course_entitlements e
    where e.course_id = p_course_id and e.member_id = auth.uid()
  );
$$;

revoke all on function public.has_course_access(uuid) from public;
grant execute on function public.has_course_access(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Tighten lessons_read_public: paid course lessons need an entitlement.
--    Free courses (price_ghs is null) stay fully public, so the build can
--    still bake them.
-- ---------------------------------------------------------------------------
drop policy if exists "lessons_read_public" on public.lessons;
create policy "lessons_read_public"
  on public.lessons for select
  using (exists (
    select 1 from public.courses c
    where c.id = lessons.course_id
      and c.published = true
      and (c.price_ghs is null or public.has_course_access(c.id))
  ));

-- ---------------------------------------------------------------------------
-- 7. course_quote — server-side price. Returns nothing when the course is not
--    payable (missing/unpublished/free).
-- ---------------------------------------------------------------------------
create or replace function public.course_quote(p_course_id uuid)
returns table (course_id uuid, fee_ghs numeric)
language plpgsql security definer set search_path = public
as $$
declare
  r record;
begin
  select c.id, c.price_ghs into r
  from public.courses c
  where c.id = p_course_id and c.published = true and c.price_ghs is not null and c.price_ghs > 0;

  if r is null then
    return;
  end if;

  course_id := r.id;
  fee_ghs := r.price_ghs;
  return next;
end;
$$;

revoke all on function public.course_quote(uuid) from public;
grant execute on function public.course_quote(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. grant_course_access — internal, ungranted helper. Idempotent.
-- ---------------------------------------------------------------------------
create or replace function public.grant_course_access(
  p_course_id uuid, p_member_id uuid, p_payment_id uuid default null
)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if p_member_id is null or p_course_id is null then
    return false;
  end if;

  insert into public.course_entitlements (member_id, course_id, payment_id)
  values (p_member_id, p_course_id, p_payment_id)
  on conflict (member_id, course_id) do nothing;

  return true;
end;
$$;

revoke all on function public.grant_course_access(uuid, uuid, uuid) from public;

-- ---------------------------------------------------------------------------
-- 9. create_course_order — worker entry point. Requires the signed secret and
--    a real member id (verified by the worker from the access token).
-- ---------------------------------------------------------------------------
create or replace function public.create_course_order(
  p_course_id uuid,
  p_member_id uuid,
  p_phone text,
  p_network text,
  p_provider_ref text
)
returns table (provider_ref text, amount_ghs numeric, course_id uuid)
language plpgsql security definer set search_path = public
as $$
declare
  v_quote record;
  v_ref text;
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_member_id is null then
    raise exception 'member-required' using errcode = '22023';
  end if;

  select * into v_quote from public.course_quote(p_course_id);
  if v_quote is null then
    raise exception 'course-not-payable' using errcode = '22023';
  end if;

  v_ref := nullif(trim(p_provider_ref), '');
  if v_ref is null then
    raise exception 'ref-required' using errcode = '22023';
  end if;

  insert into public.course_payments (
    course_id, member_id, amount_ghs, status, provider, provider_ref, payer_phone, network
  ) values (
    p_course_id, p_member_id, v_quote.fee_ghs, 'pending', 'moolre', v_ref, p_phone, p_network
  );

  provider_ref := v_ref;
  amount_ghs := v_quote.fee_ghs;
  course_id := p_course_id;
  return next;
end;
$$;

revoke all on function public.create_course_order(uuid, uuid, text, text, text) from public;
grant execute on function public.create_course_order(uuid, uuid, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 10. confirm_course_payment_by_ref — idempotent. On paid it grants lifetime
--     access, so a confirmed payment always unlocks the course.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_course_payment_by_ref(p_ref text, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  o record;
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_status not in ('paid', 'failed') then
    return;
  end if;

  update public.course_payments
    set status = p_status,
        paid_at = case when p_status = 'paid' then now() else paid_at end
    where provider_ref = p_ref
      and status = 'pending'
    returning * into o;

  if o is null then
    return;
  end if;

  if p_status = 'paid'
     and public.grant_course_access(o.course_id, o.member_id, o.id) then
    update public.course_payments
      set fulfilled = true, fulfilled_at = now()
      where id = o.id;
  end if;
end;
$$;

revoke all on function public.confirm_course_payment_by_ref(text, text) from public;
grant execute on function public.confirm_course_payment_by_ref(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 11. get_course_sendable — receipt/admin email data. Joins the buyer profile.
-- ---------------------------------------------------------------------------
create or replace function public.get_course_sendable(p_ref text)
returns table (
  course_title text,
  amount_ghs numeric,
  payer_phone text,
  member_email text,
  member_name text
)
language plpgsql security definer set search_path = public
as $$
begin
  return query
    select c.title, p.amount_ghs, p.payer_phone,
           pr.email::text, pr.full_name
    from public.course_payments p
    join public.courses c on c.id = p.course_id
    left join public.profiles pr on pr.id = p.member_id
    where p.provider_ref = p_ref;
end;
$$;

revoke all on function public.get_course_sendable(text) from public;
grant execute on function public.get_course_sendable(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 12. HARDEN existing confirm RPCs. Bodies are unchanged apart from the
--     confirm_secret_ok() guard at the top.
-- ---------------------------------------------------------------------------
create or replace function public.confirm_donation_by_ref(p_ref text, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

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

create or replace function public.confirm_boost_payment_by_ref(p_ref text, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  o record;
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

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

create or replace function public.confirm_sponsor_payment_by_ref(p_ref text, p_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

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

comment on table public.course_payments is
  'Paid course orders. Inserted pending by the Moolre worker via create_course_order; only confirm_course_payment_by_ref mutates status and grants access.';
comment on table public.course_entitlements is
  'Lifetime course access, one row per member/course. Written only by grant_course_access (SECURITY DEFINER).';
comment on table public.app_secrets is
  'Worker-only secrets (RLS on, no policies). Read only by SECURITY DEFINER functions such as confirm_secret_ok().';
