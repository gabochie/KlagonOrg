-- ============================================================================
-- E2E TEST SWEEP for payment tables (P4). Admin-only, marker-scoped.
-- e2e/global-teardown.ts cannot DELETE payment rows via PostgREST (no
-- delete policies by design — only confirm RPCs mutate). This RPC lets the
-- throwaway E2E admin remove interrupted-run leftovers: only rows tied to
-- E2E marker identities (e2e.*@klagon.org emails, 'E2E %' names) or E2E posts.
-- Real payer rows can never match. Returns rows removed.
-- Re-runnable: YES. Destructive: NO (to real data).
-- ============================================================================

create or replace function public.admin_sweep_test_payments()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_removed int := 0;
  v_n int;
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  -- Course orders + entitlements for E2E marker members.
  delete from public.course_payments p
  using public.profiles m
  where p.member_id = m.id
    and (m.email ilike 'e2e.%@klagon.org' or m.full_name ilike 'E2E %');
  get diagnostics v_n = row_count;
  v_removed := v_removed + v_n;

  delete from public.course_entitlements e
  using public.profiles m
  where e.member_id = m.id
    and (m.email ilike 'e2e.%@klagon.org' or m.full_name ilike 'E2E %');
  get diagnostics v_n = row_count;
  v_removed := v_removed + v_n;

  -- Boost orders on E2E posts (plus any already cascade-deleted: no-op).
  delete from public.boost_payments b
  using public.posts p
  where b.post_id = p.id
    and p.title ilike 'E2E %';
  get diagnostics v_n = row_count;
  v_removed := v_removed + v_n;

  -- Sponsor orders/applications with E2E marker contacts.
  delete from public.sponsor_payments s
  using public.sponsor_applications a
  where s.application_id = a.id
    and (a.email ilike 'e2e.%@klagon.org' or a.full_name ilike 'E2E %');
  get diagnostics v_n = row_count;
  v_removed := v_removed + v_n;

  delete from public.sponsor_applications a
  where (a.email ilike 'e2e.%@klagon.org' or a.full_name ilike 'E2E %');
  get diagnostics v_n = row_count;
  v_removed := v_removed + v_n;

  -- Donation pledges/charges with E2E marker names.
  delete from public.donations d
  where d.full_name ilike 'E2E %' or d.email ilike 'e2e.%@klagon.org';
  get diagnostics v_n = row_count;
  v_removed := v_removed + v_n;

  return v_removed;
end;
$$;

revoke all on function public.admin_sweep_test_payments() from public;
grant execute on function public.admin_sweep_test_payments() to authenticated;
