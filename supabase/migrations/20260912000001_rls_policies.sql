-- ============================================================
-- KlagonStudios — Row Level Security policies
-- ============================================================

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.badges enable row level security;
alter table public.member_badges enable row level security;
alter table public.projects enable row level security;
alter table public.project_volunteers enable row level security;
alter table public.news_articles enable row level security;
alter table public.announcements enable row level security;
alter table public.contact_messages enable row level security;
alter table public.mentor_applications enable row level security;
alter table public.volunteer_signups enable row level security;
alter table public.sponsor_applications enable row level security;
alter table public.donations enable row level security;
alter table public.audit_logs enable row level security;

-- ---------- profiles ----------
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = 'member' and status = 'pending');

create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- events ----------
create policy "events_read_public" on public.events
  for select using (published = true);

create policy "events_admin_all" on public.events
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- event_rsvps ----------
create policy "event_rsvps_select_own_or_admin" on public.event_rsvps
  for select using (public.is_admin() or member_id = auth.uid());

create policy "event_rsvps_insert_self" on public.event_rsvps
  for insert with check (member_id = auth.uid() and public.is_approved_member());

create policy "event_rsvps_delete_self" on public.event_rsvps
  for delete using (member_id = auth.uid());

-- ---------- courses / lessons ----------
create policy "courses_read_public" on public.courses
  for select using (published = true);

create policy "courses_admin_all" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

create policy "lessons_read_public" on public.lessons
  for select using (exists (
    select 1 from public.courses c where c.id = lessons.course_id and c.published = true
  ));

create policy "lessons_admin_all" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- lesson_progress ----------
create policy "lesson_progress_select_own" on public.lesson_progress
  for select using (member_id = auth.uid());

create policy "lesson_progress_write_self" on public.lesson_progress
  for insert with check (member_id = auth.uid() and public.is_approved_member());

create policy "lesson_progress_delete_self" on public.lesson_progress
  for delete using (member_id = auth.uid());

-- ---------- badges ----------
create policy "badges_read_public" on public.badges
  for select using (true);

create policy "badges_admin_all" on public.badges
  for all using (public.is_admin()) with check (public.is_admin());

create policy "member_badges_select_own_or_admin" on public.member_badges
  for select using (public.is_admin() or member_id = auth.uid());

create policy "member_badges_admin_write" on public.member_badges
  for insert with check (public.is_admin());

-- ---------- projects ----------
create policy "projects_read_public" on public.projects
  for select using (true);

create policy "projects_admin_all" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- project_volunteers ----------
create policy "project_volunteers_select_own_or_admin" on public.project_volunteers
  for select using (public.is_admin() or member_id = auth.uid());

create policy "project_volunteers_insert_self" on public.project_volunteers
  for insert with check (member_id = auth.uid() and public.is_approved_member());

create policy "project_volunteers_delete_self" on public.project_volunteers
  for delete using (member_id = auth.uid());

-- ---------- news & announcements ----------
create policy "news_read_public" on public.news_articles
  for select using (published = true);

create policy "news_admin_all" on public.news_articles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "announcements_read_public" on public.announcements
  for select using (true);

create policy "announcements_admin_all" on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- outreach (anon insert, admin read, Turnstile-gated client-side) ----------
create policy "contact_messages_insert_anon" on public.contact_messages
  for insert to anon, authenticated with check (true);

create policy "contact_messages_admin_select" on public.contact_messages
  for select using (public.is_admin());

create policy "mentor_applications_insert_anon" on public.mentor_applications
  for insert to anon, authenticated with check (true);

create policy "mentor_applications_admin_select" on public.mentor_applications
  for select using (public.is_admin());

create policy "volunteer_signups_insert_open" on public.volunteer_signups
  for insert to anon, authenticated with check (true);

create policy "volunteer_signups_admin_select" on public.volunteer_signups
  for select using (public.is_admin());

create policy "sponsor_applications_insert_anon" on public.sponsor_applications
  for insert to anon, authenticated with check (true);

create policy "sponsor_applications_admin_select" on public.sponsor_applications
  for select using (public.is_admin());

-- ---------- donations (anon pending row, admin manages) ----------
create policy "donations_insert_anon" on public.donations
  for insert to anon, authenticated with check (status = 'pending');

create policy "donations_admin_all" on public.donations
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- audit logs ----------
create or replace function public.log_audit(p_action text, p_entity text, p_entity_id text default null, p_detail jsonb default '{}'::jsonb)
returns void
language sql security definer set search_path = public
as $$
  insert into public.audit_logs (actor_id, action, entity, entity_id, detail)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_detail);
$$;

create policy "audit_logs_admin_select" on public.audit_logs
  for select using (public.is_admin());