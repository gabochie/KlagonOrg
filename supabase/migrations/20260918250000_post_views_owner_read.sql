-- Owner digest engine — let post authors and admins read view counts.
-- post_views was insert-only; without a select policy the views column
-- owners see nowhere. Admins get full read; authors read views on
-- their own posts only.

drop policy if exists "post_views_admin_all" on public.post_views;
create policy "post_views_admin_all" on public.post_views
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "post_views_read_own_posts" on public.post_views;
create policy "post_views_read_own_posts" on public.post_views
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_views.post_id
        and p.submitted_by = auth.uid()
    )
  );
