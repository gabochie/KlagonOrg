-- ============================================================
-- Post moderation notifications (approve / reject)
-- The notifications table has no insert policy; rows are only
-- created by SECURITY DEFINER trigger functions. This trigger
-- notifies the post author when an admin approves or rejects
-- their submission (Phase 1 moderation UX).
-- Run AFTER 20260917120000_hyperlocal_portal.sql.
-- ============================================================

create or replace function public.posts_notify_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_title text;
  v_body text;
  v_link text;
begin
  if new.submitted_by is null then
    return new;
  end if;

  if new.status = 'approved' and old.status is distinct from 'approved' then
    v_title := 'Your post is live';
    v_body := '"' || coalesce(new.title, 'Your post') || '" was approved and is now on the Klagon portal.';
    v_link := '/news/' || new.id::text;
  elsif new.status = 'rejected' and old.status is distinct from 'rejected' then
    v_title := 'Your post needs changes';
    v_body := '"' || coalesce(new.title, 'Your post') || '" was not approved.'
      || case when new.rejected_reason is not null then ' Reason: ' || new.rejected_reason else '' end
      || ' You can edit it and resubmit.';
    v_link := '/my/posts';
  else
    return new;
  end if;

  insert into public.notifications (member_id, type, title, body, link)
  values (new.submitted_by, 'post_moderation', v_title, v_body, v_link);

  return new;
end; $$;

drop trigger if exists posts_notify_status on public.posts;
create trigger posts_notify_status
  after update on public.posts
  for each row execute procedure public.posts_notify_status();