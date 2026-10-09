-- ============================================================================
-- VERIFY: expose member_id so the page can gate printing to the holder.
-- Only the signed-in holder may print/save the certificate PDF; anyone may
-- verify. Additive: widens the RETURNS table of verify_certificate only.
-- Re-runnable: YES. Destructive: NO.
-- ============================================================================

drop function if exists public.verify_certificate(text);

create function public.verify_certificate(p_code text)
returns table (
  code text,
  recipient_name text,
  course_title text,
  issued_at timestamptz,
  revoked boolean,
  member_id uuid
)
language sql stable security definer set search_path = public
as $$
  select
    c.code,
    c.recipient_name,
    co.title,
    c.issued_at,
    (c.revoked_at is not null) as revoked,
    c.member_id
  from public.certificates c
  join public.courses co on co.id = c.course_id
  where c.code = nullif(btrim(upper(coalesce(p_code, ''))), '')
  limit 1;
$$;

revoke all on function public.verify_certificate(text) from public;
grant execute on function public.verify_certificate(text) to anon, authenticated;
