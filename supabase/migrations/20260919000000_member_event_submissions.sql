-- ============================================================
-- Member event submissions with admin approval.
-- Mirrors the map_points moderation pattern:
--   members insert events as status='pending' (never published),
--   admins approve/reject via the moderate_event() RPC,
--   authors are notified on approval/rejection via trigger.
-- Run AFTER the initial schema + public content views.
-- ============================================================

-- ---------- columns ----------
alter table public.events
  add column if not exists status public.member_status not null default 'pending',
  add column if not exists rejected_reason text,
  add column if not exists moderated_by uuid references public.profiles(id) on delete set null;

alter table public.events
  drop constraint if exists events_created_by_fkey;
alter table public.events
  add constraint events_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;

-- Existing published rows are live, so treat them as approved.
update public.events set status = 'approved' where published = true and status = 'pending';

create index if not exists events_status_idx on public.events (status);
create index if not exists events_created_by_idx on public.events (created_by);

-- ---------- RLS ----------
-- Members can see their own submissions that are not yet live
-- (pending, rejected or formerly live) so they can track + resubmit.
create policy "events_owner_select_nonlive" on public.events
  for select using (auth.uid() = created_by and status <> 'approved');

-- Approved members can propose an event. It always lands as 'pending'
-- and unpublished; an admin must approve it before anyone sees it.
create policy "events_member_insert" on public.events
  for insert to authenticated
  with check (
    auth.uid() = created_by
    and public.is_approved_member()
    and status = 'pending'
    and published = false
  );

-- Owners may edit/withdraw only their own still-pending proposals.
create policy "events_owner_update_pending" on public.events
  for update using (auth.uid() = created_by and status = 'pending')
  with check (auth.uid() = created_by and status = 'pending' and published = false);

create policy "events_owner_delete_pending" on public.events
  for delete using (auth.uid() = created_by and status = 'pending');

-- ---------- public view: only approved events are visible ----------
create or replace view public.events_public as
select
  e.id,
  e.title,
  e.type,
  e.description,
  e.date,
  e.time,
  e.location,
  e.spots,
  e.created_by,
  e.created_at,
  count(r.id)::int                       as rsvp_count,
  greatest(e.spots - count(r.id), 0)::int as spots_left
from public.events e
left join public.event_rsvps r on r.event_id = e.id
where e.status = 'approved'
group by e.id
order by e.date asc;

grant select on public.events_public to anon, authenticated;

-- ---------- moderation RPC (admin approves/rejects, audits the change) ----------
create or replace function public.moderate_event(
  p_event_id uuid,
  p_status public.member_status,
  p_reason text default null
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_status = 'approved' then
    update public.events
       set status = 'approved',
           published = true,
           rejected_reason = null,
           moderated_by = auth.uid()
     where id = p_event_id;
  else
    update public.events
       set status = p_status,
           published = false,
           rejected_reason = p_reason,
           moderated_by = auth.uid()
     where id = p_event_id;
  end if;

  perform public.log_audit(
    'event_moderate',
    'events',
    p_event_id::text,
    jsonb_build_object('status', p_status)
  );
end;
$$;

revoke all on function public.moderate_event(uuid, public.member_status, text) from public, anon;
grant execute on function public.moderate_event(uuid, public.member_status, text) to authenticated;

-- ---------- author notifications (approve / reject) ----------
create or replace function public.events_notify_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
  v_body text;
  v_link text;
begin
  if new.created_by is null then
    return new;
  end if;

  if new.status = 'approved' and old.status is distinct from 'approved' then
    v_title := 'Your event is live';
    v_body := '"' || coalesce(new.title, 'Your event') || '" was approved and is now on the Klagon events page.';
    v_link := '/events';
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    v_title := 'Your event needs changes';
    v_body := '"' || coalesce(new.title, 'Your event') || '" was not approved.'
      || case when new.rejected_reason is not null then ' Reason: ' || new.rejected_reason else '' end
      || ' You can edit it and resubmit.';
    v_link := '/dashboard/events';
  else
    return new;
  end if;

  insert into public.notifications (member_id, type, title, body, link)
  values (new.created_by, 'event_moderation', v_title, v_body, v_link);

  return new;
end; $$;

drop trigger if exists events_notify_status on public.events;
create trigger events_notify_status
  after update on public.events
  for each row execute procedure public.events_notify_status();