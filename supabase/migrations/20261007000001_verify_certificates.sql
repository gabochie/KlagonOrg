-- ============================================================================
-- VERIFY-FIRST CERTIFICATES — verifiable course certificates (additive)
-- Founder issues after 48h project review; anyone verifies at /verify/[code].
-- Code format: KLG-<course-slug-prefix>-<6 random hex>, e.g. KLG-AU-9F3C2B.
-- RLS: public (anon+authenticated) can SELECT by code only via the
-- verify_certificate() function; only admins write (issue_certificate RPC).
-- Re-runnable: YES. Destructive: NO.
-- ============================================================================

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  member_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  recipient_name text not null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (member_id, course_id)
);

create index if not exists certificates_code_idx on public.certificates (code);
create index if not exists certificates_member_idx on public.certificates (member_id);

alter table public.certificates enable row level security;

-- No direct read: verification goes through the function below so codes
-- cannot be enumerated by listing the table.
drop policy if exists "certificates_no_direct_read" on public.certificates;
-- (intentionally no FOR SELECT policy: anon gets zero rows by default)

drop policy if exists "certificates_admin_all" on public.certificates;
create policy "certificates_admin_all" on public.certificates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Public verification: returns the certificate row for one exact code, or nothing.
create or replace function public.verify_certificate(p_code text)
returns table (
  code text,
  recipient_name text,
  course_title text,
  issued_at timestamptz,
  revoked boolean
)
language sql stable security definer set search_path = public
as $$
  select
    c.code,
    c.recipient_name,
    co.title,
    c.issued_at,
    (c.revoked_at is not null) as revoked
  from public.certificates c
  join public.courses co on co.id = c.course_id
  where c.code = nullif(btrim(upper(coalesce(p_code, ''))), '')
  limit 1;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;

-- Admin issuance: requires an entitlement (paid or manually granted) first.
create or replace function public.issue_certificate(p_member_id uuid, p_course_id uuid, p_name text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_code text;
  v_title text;
  v_name text;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;
  if not exists (
    select 1 from public.course_entitlements e
    where e.member_id = p_member_id and e.course_id = p_course_id
  ) then
    raise exception 'member holds no entitlement for this course';
  end if;
  select title into v_title from public.courses where id = p_course_id;
  -- Code: KLG- + first 2 title initials + 6 random hex chars (from md5).
  v_code := 'KLG-' || upper(substring(regexp_replace(coalesce(v_title, 'X'), '[^A-Za-z]', '', 'g'), 1, 2))
    || '-' || upper(substring(md5(gen_random_uuid()::text || now()::text), 1, 6));
  -- recipient_name is NOT NULL, so a blank argument must be resolved here:
  -- fall back to the member's own name rather than failing mid-issue.
  v_name := nullif(btrim(coalesce(p_name, '')), '');
  if v_name is null then
    select nullif(btrim(full_name), '') into v_name
    from public.profiles where id = p_member_id;
  end if;
  v_name := coalesce(v_name, 'KLAGON member');
  insert into public.certificates (code, member_id, course_id, recipient_name)
  values (v_code, p_member_id, p_course_id, v_name)
  on conflict (member_id, course_id) do update
  set recipient_name = excluded.recipient_name;
  select code into v_code from public.certificates
  where member_id = p_member_id and course_id = p_course_id;
  return v_code;
end;
$$;

revoke all on function public.issue_certificate(uuid, uuid, text) from public;
grant execute on function public.issue_certificate(uuid, uuid, text) to authenticated;
