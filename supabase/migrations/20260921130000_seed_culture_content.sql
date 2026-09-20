-- ============================================================
-- Seed the Arts & Culture hub (trust gate: real content first).
-- Org-run cultural programming (future dates) + org-authored
-- feature posts. Artistic/creative individual profiles are left
-- to real members — no fabricated people.
-- Run AFTER 20260921120000_culture_hub.sql.
-- ============================================================

-- ---------- org-run cultural events (approved + tagged) ----------
insert into public.events (type, title, description, date, time, location, spots, status, published, created_by, tags)
select
  'service',
  'Arts & Culture Open Mic — the Culture Hub debut',
  'An open air of music and performance to launch the Culture Hub: bring a song, a poem, a drum
   or just your voice. A relaxed evening of the talent that runs through Klagon, with light food sold
   at the venue by local chop bars.',
  (current_date + interval '21 days')::date,
  '17:30',
  'Klagon Community Centre (Nungua road junction)',
  120,
  'approved',
  true,
  p.id,
  array['cultural', 'music']
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

insert into public.events (type, title, description, date, time, location, spots, status, published, created_by, tags)
select
  'workshop',
  'Ga drumming & cultural rhythm workshop',
  'A hands-on session on the hand drum rhythms behind Klagon''s festivals and celebrations. Led by
   experienced local players, beginners welcome. Drums in limited supply — bring your own if you have one.',
  (current_date + interval '35 days')::date,
  '16:00',
  'Klagon Assembly Hall',
  40,
  'approved',
  true,
  p.id,
  array['cultural', 'music', 'heritage']
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- ---------- org-authored culture feature posts (approved + live) ----------
insert into public.posts (type, title, excerpt, body, category, area, status, submitted_by, author_name, author_badge, published_at)
select
  'news',
  'The sound of Klagon: how Ga drumming still carries the community',
  'A look at the rhythm that has kept Klagon connected through festivals, naming days and every celebration — and how the Culture Hub aims to keep it alive.',
  'The drumming you hear across Klagon is never background noise. It is the call of a festival, the
   weight of a naming day, the pulse of a community that still gathers and still shares news the
   old way — through rhythm and sound.

   Festivals are when it swells loudest: the processions, the dancing, the food stalls that line the
   streets. Between festivals, named and birthday celebrations keep the traditions moving through
   every household.,

   The Arts & Culture Hub on klagon.org is where these rhythms get a home online. We profile the
   players, list the gatherings, and keep the story of Chieftaincy & Culture in Klagon in one place —
   so the next generation finds it, hears it, and carries it forward.',
  'Chieftaincy & Culture',
  'klagon',
  'approved',
  p.id,
  'KLAGON.org Editorial',
  'editorial',
  now()
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

insert into public.posts (type, title, excerpt, body, category, area, status, submitted_by, author_name, author_badge, published_at)
select
  'news',
  'Arts & Culture on klagon.org: your festivals, your music, your stories',
  'The Culture Hub is open — one place for local festivals, performances and the stories of the creatives making Klagon buzz.',
  'Culture in Klagon has always been word of mouth: someone knows someone, the printed handbill at the
   junction, the announcement in church. The Arts & Culture Hub gives those moments a rallying point.,

   Here you will find approved cultural events — festivals, performances, open stages — plus long-form
   features on the music, craft and traditions of the community.,

   Got something cultural coming up? Any registered member can propose an event; an admin reviews it
   before it goes live. And if you write, photograph or document the culture around you, share it — the
   best contributions get published and attributed.',
  'Arts & Music',
  'klagon',
  'approved',
  p.id,
  'KLAGON.org Editorial',
  'editorial',
  now()
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;