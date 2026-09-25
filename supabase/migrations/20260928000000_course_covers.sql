-- Phase A: course feature images.
-- Adds courses.cover_url, a public-read course-media bucket (admin writes),
-- and exposes cover_url through courses_public. Rendering falls back to the
-- existing pastel+emoji block when cover_url is null (the placeholder rule).

alter table public.courses
  add column if not exists cover_url text;

-- ---------- course-media bucket ----------
insert into storage.buckets (id, name, public)
values ('course-media', 'course-media', true)
on conflict (id) do nothing;

-- Public reads course covers.
drop policy if exists "course_media_read_public" on storage.objects;
create policy "course_media_read_public" on storage.objects
  for select using (bucket_id = 'course-media');

-- Admins upload into per-course folders only.
drop policy if exists "course_media_insert_admin" on storage.objects;
create policy "course_media_insert_admin" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'course-media'
    and public.is_admin()
    and (storage.foldername(name))[1] = 'courses'
  );

-- Admins remove covers.
drop policy if exists "course_media_delete_admin" on storage.objects;
create policy "course_media_delete_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'course-media'
    and public.is_admin()
    and (storage.foldername(name))[1] = 'courses'
  );

-- ---------- courses_public: expose cover_url ----------
create or replace view public.courses_public as
select
  c.id,
  c.title,
  c.category,
  c.icon,
  c.description,
  c.cover_url,
  c.created_at,
  count(l.id)::int as lesson_count
from public.courses c
left join public.lessons l on l.course_id = c.id
where c.published = true
group by c.id
order by c.created_at asc;

alter view public.courses_public
  set (security_invoker = true);
