-- Add content (rich markdown body) to lessons and seed the Business course.
alter table public.lessons add column if not exists content text;


