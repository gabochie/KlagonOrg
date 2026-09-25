-- Phase B: volunteer applications with terms, Ghana Card ID + photo, probation.
-- Replaces one-click volunteer_signups with a verifiable application pipeline:
-- pending -> probationary (30 days) -> active | inactive, or rejected.
-- ID fields live on the application (not profiles): scoped, admin-read-only,
-- never exposed publicly. Photo uploads go to the member-media bucket.

-- ---------- applications ----------
create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  role text not null,
  status text not null default 'pending'
    check (status in ('pending', 'probationary', 'active', 'inactive', 'rejected')),
  terms_accepted_at timestamptz not null default now(),
  terms_version text not null default '2026-09',
  id_type text not null check (id_type in ('ghana_card', 'voter_id', 'passport', 'drivers_license')),
  id_number text not null,
  photo_url text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  probation_ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique nulls not distinct (member_id, post_id, role)
);

-- ---------- RLS ----------
alter table public.volunteer_applications enable row level security;

drop policy if exists "volunteer_applications_select_own_or_admin" on public.volunteer_applications;
create policy "volunteer_applications_select_own_or_admin" on public.volunteer_applications
  for select using (public.is_admin() or member_id = auth.uid());

drop policy if exists "volunteer_applications_insert_self" on public.volunteer_applications;
create policy "volunteer_applications_insert_self" on public.volunteer_applications
  for insert with check (member_id = auth.uid() and public.is_approved_member());

drop policy if exists "volunteer_applications_admin_all" on public.volunteer_applications;
create policy "volunteer_applications_admin_all" on public.volunteer_applications
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- member-media bucket (ID/selfie photos, future avatars) ----------
insert into storage.buckets (id, name, public)
values ('member-media', 'member-media', true)
on conflict (id) do nothing;

-- Public reads (photos are shown on Team page / profiles once approved).
drop policy if exists "member_media_read_public" on storage.objects;
create policy "member_media_read_public" on storage.objects
  for select using (bucket_id = 'member-media');

-- Members upload into their own folder only.
drop policy if exists "member_media_insert_own" on storage.objects;
create policy "member_media_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'member-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Members remove their own uploads.
drop policy if exists "member_media_delete_own" on storage.objects;
create policy "member_media_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'member-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------- application lifecycle: probation date + member notifications ----------
create or replace function public.volunteer_application_events()
returns trigger
language plpgsql
security definer
as $$
begin
  -- New application received.
  if TG_OP = 'INSERT' then
    insert into public.notifications (member_id, type, title, body, link)
    values (
      NEW.member_id, 'volunteer',
      'Application received 🙋',
      'Your application for "' || NEW.role || '" is under review. We will confirm within a few days.',
      '/dashboard/volunteer'
    );
    return NEW;
  end if;

  -- Status transitions.
  if TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status then
    if NEW.status = 'probationary' then
      NEW.probation_ends_at := coalesce(NEW.probation_ends_at, now() + interval '30 days');
      NEW.reviewed_at := coalesce(NEW.reviewed_at, now());
      insert into public.notifications (member_id, type, title, body, link)
      values (
        NEW.member_id, 'volunteer',
        'Welcome aboard — probation started 🎉',
        'Your 30-day probation for "' || NEW.role || '" has begun. It is unpaid and your continuation depends on performance during these 30 days.',
        '/dashboard/volunteer'
      );
    elsif NEW.status = 'active' then
      NEW.reviewed_at := coalesce(NEW.reviewed_at, now());
      insert into public.notifications (member_id, type, title, body, link)
      values (
        NEW.member_id, 'volunteer',
        'You are confirmed ✅',
        'Your probation review for "' || NEW.role || '" passed. Thank you for your service to Klagon.',
        '/dashboard/volunteer'
      );
    elsif NEW.status = 'inactive' then
      insert into public.notifications (member_id, type, title, body, link)
      values (
        NEW.member_id, 'volunteer',
        'Volunteer role update',
        'Your "' || NEW.role || '" engagement has ended. Thank you for the time you gave — you can apply for other roles anytime.',
        '/dashboard/volunteer'
      );
    elsif NEW.status = 'rejected' then
      insert into public.notifications (member_id, type, title, body, link)
      values (
        NEW.member_id, 'volunteer',
        'Application update',
        'Your application for "' || NEW.role || '" was not successful this time. You are welcome to apply for other roles.',
        '/volunteer'
      );
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_volunteer_application_events on public.volunteer_applications;
create trigger trg_volunteer_application_events
before insert or update on public.volunteer_applications
for each row execute function public.volunteer_application_events();
