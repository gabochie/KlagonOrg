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
    'Walk your assigned beat in Klagon (or Lashibi/Tema). Visit shops and services, confirm names, phones and hours, take a photo with the owner\u2019s signed consent (the /field app guides you), and submit each capture. You are the moat: our directory and map only stay real because of you.\n\nSkills we look for (training given): reliability, a phone with data, good local knowledge, honesty about consent. Walking or trotro to your beat.\n\nCommitment: piece-rate, 2\u20134 walks a week.\n\nHow to apply: send a WhatsApp message to 026 870 8895 with the role name, your name, age, neighbourhood, and why you want this role.',
    'Gig/Freelance',
    '{"company":"KLAGON.org","salary_range_ghs":"Volunteer-first: stipend GH\u00b2200\u2013400/mo as funds allow","deadline":"2026-10-31","position_type":"Gig/Freelance"}'::jsonb
  ),
  (
    'Moderation Assistant — Jobs & Events',
    'Help keep the community board clean and trustworthy: review job and event submissions within 48 hours.',
    'You own one moderation stream (jobs or events) inside the admin queue: approve genuine posts fast, reject or request edits on spam/duplicates, always respecting the REAL / DEMO / COMING SOON rule. You are the reason people trust what they read here.\n\nSkills we look for: good judgement, eye for detail, calm handling of rejections, WhatsApp literacy.\n\nCommitment: 3\u20135 hours a week, shifts you choose.\n\nHow to apply: send a WhatsApp message to 026 870 8895 with the role name, your name, age, neighbourhood, and why you would make a fair moderator.',
    'Volunteer',
    '{"company":"KLAGON.org","salary_range_ghs":"Volunteer first; stipend GH\u00b2200\u2013400/mo as funds allow","deadline":"2026-10-31","position_type":"Volunteer"}'::jsonb
  ),
  (
    'WhatsApp Community Hotline Operator',
    'Be the human behind the number: take business claims, answer "know a number?" requests, and point members to the right tools.',
    'Run the community WhatsApp line in shifts: guide business owners through claiming their free listing, collect missing phone numbers and opening hours, help members RSVP or find the jobs/map pages, and log everything for the outreach team.\n\nSkills we look for: friendly phone manner, patience, bilingual (English + Twi/Ga) is a plus, WhatsApp comfort.\n\nCommitment: 2\u20133 shift slots a week, evening and weekend friendly.\n\nHow to apply: WhatsApp 026 870 8895 with the role name, your name, age, and your language skills.',
    'Part-time',
    '{"company":"KLAGON.org","salary_range_ghs":"Volunteer-first: stipend GH\u00b2200\u2013400/mo as funds allow","deadline":"2026-10-31","position_type":"Part-time"}'::jsonb
  ),
  (
    'Community Journalist — "We Walked Klagon Today"',
    'Tell the real story of Klagon: profile businesses, cover events, and publish photo essays from the field.',
    'Write 2\u20134 pieces a month for the "Klagon Today" feed and blog: business profiles, event coverage, and vivid "we walked Klagon today" photo essays that make the community visible to itself. Collaborates with the Field Walkers for accurate detail and consented photos.\n\nSkills we look for: strong writing in English (Twi/Ga phrases welcome), curiosity, reliability, a phone with a decent camera.\n\nCommitment: piece-rate, 2\u20134 stories a month.\n\nHow to apply: WhatsApp 026 870 8895 with the role name, your name, age, neighbourhood, and two local stories you would start with.',
    'Gig/Freelance',
    '{"company":"KLAGON.org","salary_range_ghs":"Per-story stipend as funds allow (volunteer-first)","deadline":"2026-10-31","position_type":"Gig/Freelance"}'::jsonb
  ),
  (
    'Business Outreach & Directory Claims Assistant',
    'Knock doors with purpose: help the 740 listed businesses claim their free profiles and get verified.',
    'Visit businesses in your zone, explain the free claim, help owners complete their listing (photo, hours, WhatsApp number), and hand off verified rows to the ops team. A warm, patient people role \u2014 the front door of our business directory.\n\nSkills we look for: confidence talking to people (English/Twi/Ga), resilience, good shoe game, phone literacy.\n\nCommitment: 6\u20138 hours a week, mornings or afternoons.\n\nHow to apply: WhatsApp 026 870 8895 with the role name, your name, age, neighbourhood, and the best time you are free to walk.',
    'Part-time',
    '{"company":"KLAGON.org","salary_range_ghs":"Volunteer-first: stipend + per-claim bonus as funds allow","deadline":"2026-10-31","position_type":"Part-time"}'::jsonb
  ),
  (
    'Map & Data Steward',
    'Keep the Klagon Knowledge Map accurate: new pins, needs reports, and directory cross-references.',
    'Maintain map entities (places, businesses, community needs), verify new submissions, set severity flags on needs, and cross-check map data against the directory and OpenStreetMap. Learn real data skills while you work.\n\nSkills we look for: careful, organized, comfortable with lists and spreadsheets, curiosity about maps.\n\nCommitment: internship-style, 4\u20136 hours a week for a defined learning track.\n\nHow to apply: WhatsApp 026 870 8895 with the role name, your name, age, neighbourhood, and one map correction you have noticed in Klagon.',
    'Internship',
    '{"company":"KLAGON.org","salary_range_ghs":"Internship: stipend GH\u00b2200/Mo as funds allow","deadline":"2026-10-31","position_type":"Internship"}'::jsonb
  ),
  (
    'Member Success — First-Contact Caller',
    'Be the friendly first voice new members meet: help people join, verify, and find their first win.',
    'Call newly registered members within 48 hours: welcome them, help them finish their profile, confirm their phone, and connect them to one thing they can use this week (a job, a course, a map need, an event). Log outcomes honestly.\n\nSkills we look for: warm phone manner, patience, good listener, English + Twi/Ga a plus.\n\nCommitment: 2\u20133 calling shifts a week, evenings preferred.\n\nHow to apply: WhatsApp 026 870 8895 with the role name, your name, age, and your calling hours.',
    'Volunteer',
    '{"company":"KLAGON.org","salary_range_ghs":"Volunteer first; stipend GH\u00b2200\u2013400/mo as funds allow","deadline":"2026-10-31","position_type":"Volunteer"}'::jsonb
  ),
  (
    'Learning Content Assistant',
    'Help build the courses that teach the next wave: research, draft, and review learning tracks.',
    'Work with the curriculum team to draft lessons for Klagon\'s Learning Hub (digital skills, data literacy, entrepreneurship from real local case studies). Research local examples, structure lessons, and test content with real learners for clarity.\n\nSkills we look for: clear writing, patience, ability to explain simply, willingness to learn and be corrected.\n\nCommitment: internship-style, 3\u20135 hours a week.\n\nHow to apply: WhatsApp 026 870 8895 with the role name, your name, age, neighbourhood, and one lesson you would love to teach Klagon.',
    'Internship',
    '{"company":"KLAGON.org","salary_range_ghs":"Internship: stipend GH\u00b2200/mo as funds allow","deadline":"2026-10-31","position_type":"Internship"}'::jsonb
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