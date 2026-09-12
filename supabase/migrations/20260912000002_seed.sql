-- ============================================================
-- KlagonStudios — seed data
-- Run only on empty/development databases.
-- ============================================================

-- ---------- badges ----------
insert into public.badges (name, icon) values
  ('First Login', '🌟'),
  ('Event Goer', '📅'),
  ('AI Certified', '🤖'),
  ('Volunteer', '🌳'),
  ('Builder', '🔨'),
  ('Leader', '🏆'),
  ('Mentor', '🌱')
on conflict (name) do nothing;

-- ---------- courses ----------
do $$
begin
  if not exists (select 1 from public.courses where title = 'Introduction to AI') then
    insert into public.courses (title, category, icon, description) values
      ('Introduction to AI', 'Future Skills', '🤖', 'AI tools, machine learning basics, data analysis, and prompt engineering.');
  end if;
  if not exists (select 1 from public.courses where title = 'Financial Literacy Basics') then
    insert into public.courses (title, category, icon, description) values
      ('Financial Literacy Basics', 'Finance', '💰', 'Budgeting, saving, mobile money, and financial planning for youth.');
  end if;
  if not exists (select 1 from public.courses where title = 'Leadership Foundations') then
    insert into public.courses (title, category, icon, description) values
      ('Leadership Foundations', 'Leadership', '🏆', 'Team leadership, communication skills, and community organizing.');
  end if;
  if not exists (select 1 from public.courses where title = 'Start Your First Business') then
    insert into public.courses (title, category, icon, description) values
      ('Start Your First Business', 'Entrepreneurship', '🚀', 'Starting a business, validating ideas, funding, and scaling in Ghana.');
  end if;
  if not exists (select 1 from public.courses where title = 'Communication That Wins') then
    insert into public.courses (title, category, icon, description) values
      ('Communication That Wins', 'Communication', '💬', 'Speak and write with clarity, confidence, and impact.');
  end if;
  if not exists (select 1 from public.courses where title = 'Build Your Career Roadmap') then
    insert into public.courses (title, category, icon, description) values
      ('Build Your Career Roadmap', 'Career', '🗺️', 'CV writing, interview prep, freelancing, and career planning.');
  end if;
end $$;

-- ---------- lessons (one per course, expanded by admins later) ----------
insert into public.lessons (course_id, title, sort_order, duration_min)
select c.id, c.title || ' — Getting Started', 0, 10
from public.courses c
where c.title in ('Introduction to AI', 'Financial Literacy Basics', 'Leadership Foundations', 'Start Your First Business', 'Communication That Wins', 'Build Your Career Roadmap')
  and not exists (select 1 from public.lessons l where l.course_id = c.id);

-- ---------- events ----------
insert into public.events (title, type, description, date, time, location, spots) values
  ('Introduction to AI Tools', 'workshop', 'Hands-on intro to AI tools you can use today.', '2025-07-12', '10:00 AM', 'Community Hall, Klagon', 30),
  ('Klagon Problem-Solving Hack', 'hackathon', 'Tackle real community challenges with tech.', '2025-07-19', '9:00 AM', 'KlagonStudios Hub', 25),
  ('Public Speaking & Influence', 'leadership', 'Build confidence and public-speaking skills.', '2025-07-23', '5:00 PM', 'Community Hall', 0),
  ('Klagon Clean-Up Drive', 'service', 'Community clean-up across Klagon Central.', '2025-07-26', '7:00 AM', 'Klagon Central', 0);

-- ---------- projects ----------
insert into public.projects (title, description, icon, status, volunteers_target, progress) values
  ('Klagon Tree-Planting Drive', 'Planting 200 trees across Klagon key areas.', '🌳', 'active', 20, 60),
  ('Digital Literacy for Seniors', 'Weekly sessions teaching phones, mobile money, and the internet.', '💻', 'recruiting', 15, 25),
  ('Youth Coding Club', 'Introducing students to programming and computational thinking.', '🎓', 'active', 12, 0);

-- ---------- news ----------
insert into public.news_articles (title, excerpt, category, author_name, read_time_min, published_at) values
  ('KlagonStudios Launches New Career Planning Course', 'A brand new 5-lesson career roadmap course has launched for Klagon youth.', 'Programs', 'Emmanuel Kumi', 3, now() - interval '2 days'),
  ('Klagon Problem-Solving Hackathon: Teams Now Forming', 'Register for the July 19 hackathon and tackle real community challenges.', 'Events', 'Ama Kofi', 2, now() - interval '4 days'),
  ('Mentor Spotlight: Kweku Asante Opens 1-on-1 Sessions', 'Software engineer Kweku Asante opens 3 slots for mentoring this month.', 'Community', 'KlagonStudios Team', 4, now() - interval '6 days'),
  ('Tree-Planting Drive Reaches 60% of Goal', '14 dedicated volunteers push the drive past halfway.', 'Environment', 'Serwaa Boateng', 2, now() - interval '8 days'),
  ('Digital Literacy Program Expands to Seniors', 'Dedicated sessions for senior residents of Klagon.', 'Programs', 'Mary Acheampong', 3, now() - interval '10 days'),
  ('KlagonStudios Partners with Action Aid Ghana', 'A new partnership for entrepreneurship and life-skills workshops.', 'Partnerships', 'Emmanuel Kumi', 5, now() - interval '12 days');

-- ---------- announcements ----------
insert into public.announcements (title, body, pin_until) values
  ('New Learning Track: Career Planning', 'A brand new 5-lesson career roadmap course has just launched. Be among the first to complete it.', now() + interval '7 days'),
  ('Hackathon Teams Now Open', 'Form your team of 2–4 before July 17 to participate in the Klagon Problem-Solving Hack.', null),
  ('Mentor Kweku Asante is available', 'Software engineer Kweku just opened 3 slots for 1-on-1 sessions this month.', null);