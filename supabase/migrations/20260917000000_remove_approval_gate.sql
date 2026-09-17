-- Remove the manual membership-approval gate.
-- Members are auto-approved at signup (see 20260912003000_auto_approve_members.sql),
-- so the old self-update policy (which required status = 'pending') silently broke
-- profile edits for approved members. Self-update now works for any member row;
-- role escalation stays blocked. Admin moderation (reject) still works via the
-- admin-all policy.

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id and role = 'member');

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = 'member');

-- Legacy pending rows: nothing needs manual approval anymore. Clear them so
-- no stranded member hits a pending state. (Reject remains for moderation.)
update public.profiles set status = 'approved' where status = 'pending';