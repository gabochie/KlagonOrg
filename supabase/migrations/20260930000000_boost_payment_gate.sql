-- purchase_boost: worker-only, because it grants paid placement for free.
--
-- The function body only checks that the caller owns the post
-- (r.submitted_by = auth.uid()). It has no payment check, because the design
-- is that the payment worker calls it *after* payment is confirmed:
--
--   -- On payment confirmed the worker calls purchase_boost() (below)
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and
-- 20260918210000_fix_security_lints_p2.sql revoked it from `anon` only. Any
-- signed-in post owner could therefore call it directly and grant themselves a
-- free 3-day featured boost (or 7-day premium on Properties/Auto) without
-- paying. `src/lib/posts.ts` even shipped an unused client wrapper
-- (purchaseBoost) that would have done it from the browser.
--
-- Lock it to the service role, which is what the payment worker authenticates
-- as. The worker already uses the service role for donation confirmation, so
-- this needs no new credential.

do $$
declare
  f regprocedure := to_regprocedure('public.purchase_boost(uuid, public.boost_tier)');
begin
  if f is not null then
    execute 'revoke all on function ' || f::text || ' from public';
    execute 'revoke all on function ' || f::text || ' from anon, authenticated';
    execute 'grant execute on function ' || f::text || ' to service_role';
  end if;
end;
$$;

comment on function public.purchase_boost(uuid, public.boost_tier) is
  'Worker-only. Grants paid featured placement with no payment check of its own; '
  'callers must be the payment worker (service_role) acting on a confirmed payment. '
  'End users request a boost via lead capture instead.';
