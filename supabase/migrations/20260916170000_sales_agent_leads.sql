-- KlagonOrg AI sales agent (Phase 1): extend lead_captures + secure capture path.
-- Adds phone/intent columns, enables RLS, and a security-definer RPC the
-- Worker calls (anon role) so the table never accepts public inserts.

alter table public.lead_captures
  add column if not exists phone text,
  add column if not exists intent text;

-- Allow rows without an email (phone-only leads from voice conversations).
alter table public.lead_captures
  alter column email drop not null;

-- Default source for the sales agent.
alter table public.lead_captures
  alter column source set default 'voice-agent';

-- ------------------------------------------------------------------
-- RLS: staff can read/delete; nobody inserts directly (Worker -> RPC).
-- ------------------------------------------------------------------
alter table public.lead_captures enable row level security;

drop policy if exists "lead_captures_admin_all" on public.lead_captures;
create policy "lead_captures_admin_all" on public.lead_captures
  for all
  to authenticated
  using (is_klagon_admin())
  with check (is_klagon_admin());

-- ------------------------------------------------------------------
-- log_agent_lead(p_name, p_phone, p_email, p_source, p_intent, p_profile_id)
-- Insert-or-return-existing, deduped on email. Requires phone or email.
-- ------------------------------------------------------------------
create or replace function public.log_agent_lead(
  p_name text,
  p_phone text,
  p_email text,
  p_source text,
  p_intent text default null,
  p_profile_id uuid default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_name text;
  v_phone text;
  v_id bigint;
begin
  v_email := lower(nullif(btrim(coalesce(p_email, '')), ''));
  v_name := nullif(btrim(coalesce(p_name, '')), '');
  v_phone := nullif(btrim(coalesce(p_phone, '')), '');

  if v_email is null and v_phone is null then
    raise exception 'lead needs an email or a phone number';
  end if;

  -- Dedupe on email when provided.
  if v_email is not null then
    select id into v_id
    from public.lead_captures
    where email = v_email
    order by created_at desc
    limit 1;
    if found then
      return v_id;
    end if;
  end if;

  insert into public.lead_captures (name, phone, email, source, intent, profile_id)
  values (
    v_name,
    v_phone,
    v_email,
    coalesce(nullif(btrim(coalesce(p_source, '')), ''), 'voice-agent'),
    nullif(btrim(coalesce(p_intent, '')), ''),
    p_profile_id
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.log_agent_lead(text, text, text, text, text, uuid) to anon, authenticated;