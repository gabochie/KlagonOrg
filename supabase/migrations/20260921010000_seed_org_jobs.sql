-- ============================================================
-- Seed: first KLAGON.org organization openings on the Jobs board.
-- Eat-your-own-dogfood: the org posts its own real roles via the
-- platform's jobs system (type='job', status='approved').
--
-- Goals:
--   * 8 real openings, volunteer-first wording (honest — no pay bait).
--   * 30-day auto-expiry handled by the existing posts_set_expires_at trigger.
--   * Verified visible to anon: status approved + published_at <= now().
--
-- Apply: Supabase dashboard -> SQL Editor. Rerunnable: each insert
-- guards against duplicate titles, so running twice adds nothing.
-- ============================================================

insert into public.posts
  (type, title, excerpt, body, category, area, status,
   author_name, author_badge, contact_phone, details, published_at)
select 'job', t.title, t.excerpt, t.body, t.category, 'klagon', 'approved',
       'KLAGON.org Team', 'editorial', '0268708895', t.details, now()
from (values
  (
    'Field Data Collector — "Klagon Walker"',
    'Walk Klagon, verify and photograph real businesses and places, and build the community directory from truth.',
    'Walk your assigned beat in Klagon (or Lashibi/Tema). Visit shops and services, confirm names, phones and hours, take a photo with the owner''s signed consent (the /field app guides you), and submit each capture. You are the moat: our directory and map only stay real because of you.

Skills we look for (training given): reliability, a phone with data, good local knowledge, honesty about consent. Walking or trotro to your beat.

Commitment: piece-rate, 2–4 walks a week.

How to apply: send a WhatsApp message to 026 870 8895 with the role name, your name, age, neighbourhood, and why you want this role.',
    'Gig/Freelance',
    '{"company":"KLAGON.org","salary_range_ghs":"Volunteer-first: stipend GH₵200–400/mo as funds allow","deadline":"2026-10-31","position_type":"Gig/Freelance"}'::jsonb
  ),
  (
    'Moderation Assistant — Jobs & Events',
    'Help keep the community board clean and trustworthy: review job and event submissions within 48 hours.',
    'You own one moderation stream (jobs or events) inside the admin queue: approve genuine posts fast, reject or request edits on spam/duplicates, always respecting the REAL / DEMO / COMING SOON rule. You are the reason people trust what they read here.

Skills we look for: good judgement, eye for detail, calm handling of rejections, WhatsApp literacy.

Commitment: 3–5 hours a week, shifts you choose.

How to apply: send a WhatsApp message to 026 870 8895 with the role name, your name, age, neighbourhood, and why you would make a fair moderator.',
    'Volunteer',
    '{"company":"KLAGON.org","salary_range_ghs":"Volunteer first; stipend GH₵200–400/mo as funds allow","deadline":"2026-10-31","position_type":"Volunteer"}'::jsonb
  ),
  (
    'WhatsApp Community Hotline Operator',
    'Be the human behind the number: take business claims, answer "know a number?" requests, and point members to the right tools.',
    'Run the community WhatsApp line in shifts: guide business owners through claiming their free listing, collect missing phone numbers and opening hours, help members RSVP or find the jobs/map pages, and log everything for the outreach team.

Skills we look for: friendly phone manner, patience, bilingual (English + Twi/Ga) is a plus, WhatsApp comfort.

Commitment: 2–3 shift slots a week, evening and weekend friendly.

How to apply: WhatsApp 026 870 8895 with the role name, your name, age, and your language skills.',
    'Part-time',
    '{"company":"KLAGON.org","salary_range_ghs":"Volunteer-first: stipend GH₵200–400/mo as funds allow","deadline":"2026-10-31","position_type":"Part-time"}'::jsonb
  ),
  (
    'Community Journalist — "We Walked Klagon Today"',
    'Tell the real story of Klagon: profile businesses, cover events, and publish photo essays from the field.',
    'Write 2–4 pieces a month for the "Klagon Today" feed and blog: business profiles, event coverage, and vivid "we walked Klagon today" photo essays that make the community visible to itself. Collaborates with the Field Walkers for accurate detail and consented photos.

Skills we look for: strong writing in English (Twi/Ga phrases welcome), curiosity, reliability, a phone with a decent camera.

Commitment: piece-rate, 2–4 stories a month.

How to apply: WhatsApp 026 870 8895 with the role name, your name, age, neighbourhood, and two local stories you would start with.',
    'Gig/Freelance',
    '{"company":"KLAGON.org","salary_range_ghs":"Per-story stipend as funds allow (volunteer-first)","deadline":"2026-10-31","position_type":"Gig/Freelance"}'::jsonb
  ),
  (
    'Business Outreach & Directory Claims Assistant',
    'Knock doors with purpose: help the 740 listed businesses claim their free profiles and get verified.',
    'Visit businesses in your zone, explain the free claim, help owners complete their listing (photo, hours, WhatsApp number), and hand off verified rows to the ops team. A warm, patient people role — the front door of our business directory.

Skills we look for: confidence talking to people (English/Twi/Ga), resilience, good shoe game, phone literacy.

Commitment: 6–8 hours a week, mornings or afternoons.

How to apply: WhatsApp 026 870 8895 with the role name, your name, age, neighbourhood, and the best time you are free to walk.',
    'Part-time',
    '{"company":"KLAGON.org","salary_range_ghs":"Volunteer-first: stipend + per-claim bonus as funds allow","deadline":"2026-10-31","position_type":"Part-time"}'::jsonb
  ),
  (
    'Map & Data Steward',
    'Keep the Klagon Knowledge Map accurate: new pins, needs reports, and directory cross-references.',
    'Maintain map entities (places, businesses, community needs), verify new submissions, set severity flags on needs, and cross-check map data against the directory and OpenStreetMap. Learn real data skills while you work.

Skills we look for: careful, organized, comfortable with lists and spreadsheets, curiosity about maps.

Commitment: internship-style, 4–6 hours a week for a defined learning track.

How to apply: WhatsApp 026 870 8895 with the role name, your name, age, neighbourhood, and one map correction you have noticed in Klagon.',
    'Internship',
    '{"company":"KLAGON.org","salary_range_ghs":"Internship: stipend GH₵200/mo as funds allow","deadline":"2026-10-31","position_type":"Internship"}'::jsonb
  ),
  (
    'Member Success — First-Contact Caller',
    'Be the friendly first voice new members meet: help people join, verify, and find their first win.',
    'Call newly registered members within 48 hours: welcome them, help them finish their profile, confirm their phone, and connect them to one thing they can use this week (a job, a course, a map need, an event). Log outcomes honestly.

Skills we look for: warm phone manner, patience, good listener, English + Twi/Ga a plus.

Commitment: 2–3 calling shifts a week, evenings preferred.

How to apply: WhatsApp 026 870 8895 with the role name, your name, age, and your calling hours.',
    'Volunteer',
    '{"company":"KLAGON.org","salary_range_ghs":"Volunteer first; stipend GH₵200–400/mo as funds allow","deadline":"2026-10-31","position_type":"Volunteer"}'::jsonb
  ),
  (
    'Learning Content Assistant',
    'Help build the courses that teach the next wave: research, draft, and review learning tracks.',
    'Work with the curriculum team to draft lessons for Klagon''s Learning Hub (digital skills, data literacy, entrepreneurship from real local case studies). Research local examples, structure lessons, and test content with real learners for clarity.

Skills we look for: clear writing, patience, ability to explain simply, willingness to learn and be corrected.

Commitment: internship-style, 3–5 hours a week.

How to apply: WhatsApp 026 870 8895 with the role name, your name, age, neighbourhood, and one lesson you would love to teach Klagon.',
    'Internship',
    '{"company":"KLAGON.org","salary_range_ghs":"Internship: stipend GH₵200/mo as funds allow","deadline":"2026-10-31","position_type":"Internship"}'::jsonb
  ),
  (
    'Content Creator — "Klagon Today" (Video & Social)',
    'Turn Klagon''s real stories and opportunities into short videos and social content the community shares.',
    'Shoot and edit short videos, reels and social posts for the "Klagon Today" feed: turn field walks, business stories, events and job openings into scroll-stopping clips people actually watch. Work with the Community Journalist and Field Walkers so every face has consent and every clip is honest.

Skills we look for: a phone with a decent camera, editing instinct (CapCut/InShot fine), creativity, and respect for the consent rule — never post a person without their yes.

Commitment: piece-rate, 4–8 finished pieces a month.

How to apply: WhatsApp 026 870 8895 with the role name, your name, age, neighbourhood, and one Klagon story you would love to turn into a 30-second clip.',
    'Gig/Freelance',
    '{"company":"KLAGON.org","salary_range_ghs":"Per-piece stipend as funds allow (volunteer-first)","deadline":"2026-10-31","position_type":"Gig/Freelance"}'::jsonb
  )
) as t(title, excerpt, body, category, details)
where not exists (
  select 1 from public.posts p
  where p.type = 'job' and p.title = t.title and p.status = 'approved'
);

-- Sanity check: the seeded board rows (should all be approved, published, expiring ~30 days out).
select title, category, status, expires_at is not null as has_expiry
from public.posts
where type = 'job' and author_badge = 'editorial'
order by title;