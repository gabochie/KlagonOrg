-- ============================================================================
-- ABUSE HARDENING part 2 (M5 + M6). Additive, idempotent.
--
-- M5: post_contact_messages anon-insert had no length limits (spam store).
-- Adds CHECK caps; existing rows unaffected unless violating (then migrate
-- fails loudly — inspect before forcing).
-- M6: log_agent_lead deduped email-only (case-sensitively at that). Now
-- dedupes on lower(email) AND on phone, so one person = one lead row.
-- Re-runnable: YES. Destructive: NO.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'post_contact_messages_lengths') then
    alter table public.post_contact_messages
      add constraint post_contact_messages_lengths check (
        char_length(message) between 1 and 2000
        and (sender_name is null or char_length(sender_name) <= 120)
        and (sender_phone is null or char_length(sender_phone) <= 32)
        and (sender_email is null or char_length(sender_email) <= 320)
      );
  end if;
end $$;

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

  -- Dedupe on email (case-insensitive) when provided.
  if v_email is not null then
    select id into v_id
    from public.lead_captures
    where lower(email) = v_email
    order by created_at desc
    limit 1;
    if found then
      return v_id;
    end if;
  end if;

  -- Dedupe on phone when provided (no email match).
  if v_phone is not null then
    select id into v_id
    from public.lead_captures
    where phone = v_phone
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
