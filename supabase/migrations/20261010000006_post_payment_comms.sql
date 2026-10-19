-- ============================================================================
-- POST-PAYMENT COMMS (P2). Additive, idempotent.
--
-- 1. get_boost_sendable gains payer_email (from boost_payments.metadata) so
--    the worker can receipt the payer, not just the admin. DROP+CREATE:
--    widening RETURNS cannot use CREATE OR REPLACE.
-- 2. grant_course_access inserts a paid notification (bell + dashboard) with
--    a link to the course, so buyers see confirmation in-app even when the
--    receipt email bounces or the profile has no email.
-- Re-runnable: YES. Destructive: NO.
-- ============================================================================

drop function if exists public.get_boost_sendable(text);

create function public.get_boost_sendable(p_ref text)
returns table (post_title text, amount_ghs numeric, payer_phone text, tier text, days int, payer_email text)
language plpgsql security definer set search_path = public
as $$
begin
  if not public.confirm_secret_ok() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select p.title, b.amount_ghs, b.payer_phone, b.tier::text, b.days,
           nullif(b.metadata->>'email', '')
    from public.boost_payments b
    join public.posts p on p.id = b.post_id
    where b.provider_ref = p_ref;
end;
$$;

revoke all on function public.get_boost_sendable(text) from public;
grant execute on function public.get_boost_sendable(text) to anon, authenticated;

-- Paid notification inside the access grant (idempotent: one row per member/course).
create or replace function public.grant_course_access(
  p_course_id uuid, p_member_id uuid, p_payment_id uuid default null
)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_title text;
  v_new boolean := false;
begin
  if p_member_id is null or p_course_id is null then
    return false;
  end if;

  insert into public.course_entitlements (member_id, course_id, payment_id)
  values (p_member_id, p_course_id, p_payment_id)
  on conflict (member_id, course_id) do nothing
  returning true into v_new;

  -- Notify on first grant only; repeat confirms stay silent.
  if coalesce(v_new, false) then
    select c.title into v_title from public.courses c where c.id = p_course_id;
    insert into public.notifications (member_id, type, title, body, link)
    values (
      p_member_id,
      'payment',
      'Payment confirmed — course unlocked 🎉',
      'Your lifetime access to ' || coalesce(v_title, 'your course') || ' is active. Start learning now.',
      '/learning/' || p_course_id::text
    )
    on conflict do nothing;
  end if;

  return true;
end;
$$;
