-- ============================================================
-- Balance the Arts & Culture hub across Ghana's peoples.
-- Klagon stands on Ga-Dangme land; its residents hail from
-- every region. These org-run events + editorial features give
-- Ewe, Akan, Mole-Dagbani and Dangme neighbours the same
-- first-class presence the seed gave Ga heritage.
-- No fabricated individuals — org-run programming + editorial.
-- Run AFTER 20260921130000_seed_culture_content.sql.
-- ============================================================

-- ---------- Ewe: Hogbetsotso homecoming evening ----------
insert into public.events (type, title, description, date, time, location, spots, status, published, created_by, tags)
select
  'service',
  'Hogbetsotso homecoming evening — Anlo Ewe stories of the exodus',
  'An evening for Klagon''s Ewe community and friends: the story of the walk from Notsie retold
   by elders, borborbor-style drumming into the night, and Ewe dishes sold by local vendors.
   All peoples welcome — come and listen.',
  (current_date + interval '28 days')::date,
  '18:00',
  'Klagon Community Centre (Nungua road junction)',
  150,
  'approved',
  true,
  p.id,
  array['cultural', 'music', 'heritage', 'festival']
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- ---------- Mole-Dagbani: Damba smock & durbar night ----------
insert into public.events (type, title, description, date, time, location, spots, status, published, created_by, tags)
select
  'service',
  'Damba night in Klagon — smocks, drumming and durbar stories',
  'Klagon''s northern community brings Damba home: a smock (binchera) showcase by local youth,
   Dagomba drumming, and elders recounting the durbar traditions of Dagbon, Mamprugu and Gonja.
   Come in your smock if you have one.',
  (current_date + interval '42 days')::date,
  '18:00',
  'Klagon Assembly Hall',
  150,
  'approved',
  true,
  p.id,
  array['cultural', 'music', 'heritage', 'festival']
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- ---------- Dangme neighbours: Ada & Krobo festival stories ----------
insert into public.events (type, title, description, date, time, location, spots, status, published, created_by, tags)
select
  'workshop',
  'Dangme heritage evening — Ada & Krobo festival stories',
  'Our closest neighbours, the Ada and Krobo, open their festival calendar: Asafotufiami musketry
   honours, Ngmayem millet-harvest customs and the Dipo bead heritage — told by Dangme guests,
   with drumming and dancing to close the night.',
  (current_date + interval '49 days')::date,
  '17:00',
  'Klagon Assembly Hall',
  100,
  'approved',
  true,
  p.id,
  array['cultural', 'music', 'heritage', 'festival']
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- ---------- Akan: kente heritage workshop ----------
insert into public.events (type, title, description, date, time, location, spots, status, published, created_by, tags)
select
  'workshop',
  'Kente heritage workshop — the cloth that speaks',
  'A hands-on session on Akan kente: how the patterns carry proverbs, how the loom works, and
   what each colour says. Led by local weavers and traders; looms provided, beginners welcome.',
  (current_date + interval '56 days')::date,
  '16:00',
  'Klagon Community Centre (Nungua road junction)',
  40,
  'approved',
  true,
  p.id,
  array['cultural', 'heritage']
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- ---------- editorial: the festivals Klagon travels home for ----------
insert into public.posts (type, title, excerpt, body, category, area, status, submitted_by, author_name, author_badge, published_at)
select
  'news',
  'Beyond Homowo: the festivals Klagon travels home for',
  'Homowo is our land festival — but every December and November, Klagon empties in many directions. A tour of the home festivals our neighbours keep.',
  'Every year, Klagon celebrates Homowo on the land it stands on — and then, in many directions,
   its residents travel home.

   To Anloga go the Anlo Ewe for Hogbetsotso, re-enacting the night walk out of Notsie from under
   King Agorkorli. North go Dagombas, Mamprusis and Gonjas for Damba, with its horse processions,
   night-song rehearsals and smock showcases. To Kumasi go the Asante for Adae Kese, the big Adae
   that closes the nine-cycle year at Manhyia. To Cape Coast and Elmina go the Fante for Fetu Afahye
   and Bakatue. Next door, the Ada fire musketry for Asafotufiami and the Krobo feast millet at Ngmayem.

   The Culture Hub lists them all — because in Klagon, every one of these is a home festival.',
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

-- ---------- editorial: the Dangme next door ----------
insert into public.posts (type, title, excerpt, body, category, area, status, submitted_by, author_name, author_badge, published_at)
select
  'news',
  'The Dangme next door: Ada, Krobo and the festivals closest to Klagon',
  'Kpone, Ada, the Krobo mountains — Klagon''s nearest neighbours keep some of Ghana''s oldest festivals. What Asafotufiami, Ngmayem and Dipo mean.',
  'Drive east from Klagon and you are in Dangme land within minutes: Kpone, then Ada at the Volta
   mouth; north lie the Krobo towns under the mountains they were moved from in 1892.

   The Ada remember their founding wars every first week of August at Asafotufiami — asafo    companies
   firing musketry over the water at Kpomkpompanya, washing hands and feet of war''s evils. The Manya
   Krobo feast the millet harvest at Ngmayem. And the Krobo bead the initiates at Dipo, the puberty
   rites that usher girls into womanhood.

   These are not distant traditions. They are the festivals of the next town over — and many Klagon
   households have Dangme blood in them. The Hub honours the neighbours first.',
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
