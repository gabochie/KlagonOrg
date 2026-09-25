-- Phase D: move the 9 org openings under the Volunteer tab as claimable roles.
-- 1) Flags them (details.org_role) so the Volunteer tab lists them and the
--    /jobs board excludes them.
-- 2) Rewrites compensation copy to unpaid terms (no pay until further notice).
-- 3) Rewrites the "How to apply: WhatsApp…" closing paragraph to the
--    in-app claim flow (Ghana Card ID + photo + Volunteer Terms).
-- Idempotent: all updates are conditional and re-runnable.

-- 1) Flag org roles.
update public.posts
set details = coalesce(details, '{}'::jsonb) || '{"org_role": true}'::jsonb
where type = 'job'
  and author_name = 'KLAGON.org Team'
  and status = 'approved'
  and coalesce(details->>'org_role', 'false') <> 'true';

-- 2) Unpaid compensation terms (replaces stipend wording).
update public.posts
set details = jsonb_set(
  coalesce(details, '{}'::jsonb),
  '{salary_range_ghs}',
  '"Unpaid volunteer role — no pay until further notice. 30-day probation; continuation depends on performance."'
)
where type = 'job'
  and author_name = 'KLAGON.org Team'
  and status = 'approved';

-- 3) Claim flow replaces WhatsApp apply (final paragraph of each body).
update public.posts
set body = regexp_replace(
  body,
  'How to apply:.*$',
  'How to apply: claim this role on the Volunteer page (/volunteer) with your Ghana Card ID, a clear photo, and acceptance of the Volunteer Terms. All roles are unpaid until further notice, starting with a 30-day probation — continuation depends on performance.'
)
where type = 'job'
  and author_name = 'KLAGON.org Team'
  and status = 'approved'
  and body ~ 'How to apply:';

-- Sanity check: flagged org roles with unpaid terms.
select title,
  (details->>'org_role') as org_role,
  left(details->>'salary_range_ghs', 40) as terms,
  (body ~ 'claim this role on the Volunteer page') as claim_path
from public.posts
where type = 'job' and author_name = 'KLAGON.org Team' and status = 'approved'
order by title;
