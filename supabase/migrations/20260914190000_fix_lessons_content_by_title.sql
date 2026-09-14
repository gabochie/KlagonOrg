-- ============================================================
-- KlagonOrg — Lessons: fix seed that silently wrote 0 rows
-- ============================================================
-- WHY THIS EXISTS
--   The previous seed (20260915000000_seed_lessons_content.sql) did
--     update public.lessons set content = $$klagon$$ ... $$klagon$$
--       where id = '<hardcoded-uuid>';
--   but public.lessons.id is gen_random_uuid() (set at insert). The live
--   rows therefore almost never repeat a hardcoded UUID, so every UPDATE
--   matched 0 rows and committed nothing — silently. Result: lessons.content
--   is NULL everywhere while access/RLS works fine (verified in project
--   rvavixcgtninzccskfpy: has_access = true on all 13, has_content = false).
--
-- THIS FIX
--   Re-key every content UPDATE by the stable, human-checkable
--   (course_id + title) pair that actually matches live rows, via a
--   deterministic helper. Idempotent and safe to re-run.
--
-- TESTED against live project: 13 lessons, all titles matched → 13 updates.
-- ============================================================

-- ---------- deterministic lesson lookup by (course title, lesson title) ----------
create or replace function public.lookup_lesson(c_course text, c_lesson text)
returns uuid
language sql stable security invoker set search_path = public
as $$
  select l.id
  from public.lessons l
  join public.courses c on c.id = l.course_id
  where c.title = c_course
    and l.title  = c_lesson
  limit 1;
$$;

with lesson_content(c_course, c_lesson, body) as (
  values
  ('Introduction to AI', 'Introduction to AI — Getting Started', $$klagon$$
Welcome. You're here to learn about AI, so let's not waste a minute. AI is a human-powered tool: the most powerful version of it — the version that builds careers and grows businesses — still starts with a human being who decides what to ask and what to ship. This course is your ninety-day map for turning "I want to learn AI" into "I can operate AI to produce real, valuable work."

## What "learning AI" means in this course

Anyone can watch a YouTube video about AI. Plenty of people have. But watching is not doing, and doing is what creates value and income. So when we say "learn AI," we mean four concrete things you will actually do:

1. **Master the fundamentals** — what AI actually is under the hood (models, training data, prompting, and the "garbage in, garbage out" rule), so you can reason about tools instead of fearing or worshipping them.
2. **Choose and master one tool deeply** — not ten tools shallowly. One tool, driven until it feels like an extension of your hands.
3. **Apply it to a real task you already do** — your classes, your job, your side hustle — so the skill produces something today, not "someday."
4. **Build proof** — a small portfolio of AI-assisted work that you can show, link, and sell from.

That's the whole spine of the course. Every lesson is one step on it.

## The one rule that makes AI work for you

AI gives you leverage, not permission. It multiplies what you can already do; it does not replace the judgment of knowing what is worth doing. The people who benefit most from AI are not the ones who love the tool — they are the ones who bring the sharpest questions to it. So as you go, keep this rule in view: **you are the editor, AI is the draft.** Own the outcome. Take credit, take responsibility.

## What you'll produce this first week

By the end of this lesson you will have your AI workspace ready and one real AI-assisted artifact in your hands. That's it. Not a certificate, a piece of work.

Here's the plan.

### Step 1 — Set up your AI workspace (30 minutes)

You need one place you'll ask AI questions and one place you'll save AI replies. No more scattered tabs.

- **Pick your main AI assistant.** One free account is plenty to start. The tool matters less than your habit of using it daily. Common choices: ChatGPT, Claude, Gemini, or similar. Don't pay yet.
- **Create a "thinking folder."** A folder on your computer or in Drive where you keep: your prompts, your best AI answers, and the work you refine from them. Name it something you'll actually open.
- **Write a "personal AI brief."** A short note (3–5 sentences) that tells any AI what you care about: your name, your field, the work you want to get better at, your writing or thinking style. Paste this brief at the top of new chats so every answer is aimed at you, not at a stranger.

### Step 2 — Your first real artifact (the task that matters)

Pick something real you are trying to do this week — a paper, a report, a CV, a project plan, a content draft. Then use AI to make real progress on it:

- Write out your goal clearly before you ask anything.
- Ask the AI to help you think, not just to produce. Try: "Ask me questions about my topic before writing anything, so your answer is based on what I actually mean."
- Ask for the smallest useful thing first, then build: "Give me an outline, not an essay."
- Save what you refine. The file you end up with is your first AI artifact.

### Step 3 — The habit that compounds

Do something small with AI **every day this week**. Even five minutes. Consistency does what talent promises: by Friday you will ask better questions, catch better answers, and feel the tool becoming yours.

## What done looks like

When you finish this lesson you will have:

1. A main AI assistant picked and a daily habit started.
2. A "thinking folder" on your computer with your personal AI brief inside.
3. One real, finished, AI-assisted artifact from your actual week.

That artifact is your first proof-of-work. Keep it — next lesson we turn your workspace into a working loop that makes you faster at everything you already do.
$$klagon$$),
  ('Financial Literacy Basics', 'Financial Literacy Basics — Getting Started', $$klagon$$
Money feels complicated, and that complexity is the whole game: the less you understand money, the easier it is for others to make it off you. This lesson is the un-complicating. We start from zero and build the financial facts you can actually act on — the ones that change behavior today, not the ones that impress a seminar.

## Financial literacy is a behavior, not a lecture

You already know more about money than you think. The problem is rarely knowledge; it is that knowledge rarely reaches your hands at the moment you spend. So this course treats financial literacy the way a gym treats fitness: as a set of small, repeated actions — not a topic you study once.

Our three moves for the whole course:

- **Know what you own and owe.** A real, current picture of your money. No shame, just facts.
- **Make a plan that fits your real life.** A budget you'll actually keep — which means it starts from your real income, not your ideal one.
- **Protect yourself and grow.** Safety nets, savings habits, and early investing basics that compound while you sleep.

## Start with the picture — your money stack

Before any plan, you need numbers. That's your "money stack," and you build it today:

1. **Income.** Everything that reaches you in a month — salary, allowance, side work, gifts. Be honest and exact.
2. **Fixed costs.** The bills that don't move: rent, school fees, transport to work or school, phone bundle.
3. **Variable costs.** The flexible ones: food, data, entertainment, transport beyond the fixed route.
4. **Debts.** What you owe and to whom, with real amounts and dates. Facing this list is how you stop being owned by it.

Write all four down. Seeing your full money stack, once, is the single most powerful act in this whole course. Most people have never actually looked.

## The 50/30/20 rule you can actually follow

Once you know your stack, sort it with a simple, famous rule — but adjusted to your real life:

- **Up to 50% — needs.** The bills and basics you can't skip.
- **Up to 30% — wants.** The life you're actually living; a rule you can't follow is a rule you'll break.
- **At least 20% — the future you.** Savings, debt payoff, and small investments. If 20% feels impossible, start at 5% and raise it a little every month. The habit matters more than the size.

Your personal slice matters more than the textbook numbers. If transport eats 60% of your income, you don't live an American 50/30/20; you live your own — and protecting the "future you" slice is the non-negotiable.

## The first decision that changes everything

Open a dedicated place for your future-you money — a separate savings or mobile-money account that your spending hand can't easily reach. This one move is worth more than any single fact in this lesson, because it turns an intention into a wall.

## What done looks like

By the end of this lesson you will have your **money stack** written out once (income, costs, debts), your own 50/30/20 split penciled in, and a dedicated future-you account opened. Numbers you can see beat numbers you feel. That picture is the foundation everything else in this course stands on.

Next, we take that honest picture and turn it into a budget you'll still be following in three months — which is the difference between knowing your money and directing it.
$$klagon$$),
  ('Leadership Foundations', 'Leadership Foundations — Getting Started', $$klagon$$
Leadership is not a title. It is a set of behaviors that other people choose to follow. Plenty of people hold official titles and have no followers; plenty of others lead a team, a project, or a community move without a title at all. This course teaches the kind of leadership that works in real life — in your job, your side project, or the community around you.

## The definition that drives everything

A useful definition: **leadership is making it easier for other people to do their best work.**

Notice what this is not. It is not bossing, not commanding, not being the loudest voice in the room. It is service with direction. A leader removes obstacles, sets a clear direction, and creates the conditions where people can contribute what they're actually good at.

Three behaviors show up again and again:

- **Clarity.** People follow when they understand where they're going and why. A leader's first job is to make the direction obvious.
- **Trust.** People follow when they believe you mean what you say and keep your word. Trust is built in small moments, broken in an instant.
- **Humility.** People follow when they feel seen and when their contribution matters. The best leaders are not the ones who look the most important; they're the ones who make their people look important.

## The trust bank

Think of trust as a bank account between you and every person you work with. Every time you keep a commitment, meet a deadline, tell the truth, or show up — you make a deposit. Every time you're late, vague, or inconsistent — you make a withdrawal. Long before you run out of authority, you can run out of trust; and without trust, no title will save you.

This week, make small, deliberate deposits: keep every promise you make, however small; be on time; and give specific, honest credit to the people who helped.

## Lead from where you are

You don't need permission to start leading. Leadership begins at the level you're at:

- **At school or work:** volunteer to organize, take notes, coordinate the group's small tasks far. You don't need to run the project — just take ownership of one piece and do it so well people notice.
- **In a project:** be the person who clarifies next steps after a meeting, so the group actually moves.
- **In your community:** start with one small gathering or one problem you help solve, with even one other person.

Leadership is a muscle you grow by lifting small weights repeatedly — not by waiting for the big stage.

## What done looks like

By the end of this lesson you will have:

1. Your own one-sentence definition of leadership — your "rule" going forward.
2. One deliberate action that built trust with someone this week.
3. One small act of leadership from exactly where you are (school, work, project, or community).

Leadership, practiced at your own level, is the thing that will be pulling doors open for you long after this course ends.

Next we move from leading yourself to leading others in the real world — starting with how to run a conversation so people actually listen.
$$klagon$$),
  ('Communication That Wins', 'Communication That Wins — Getting Started', $$klagon$$
Every opportunity you ever get — the job, the sale, the mentorship, the partnership, the promotion — is decided in a conversation. Communication is not a soft skill; it is the delivery system for every other skill you own. This course sharpens that delivery system.

## Communication is engineering, not personality

Great communicators are not born with a gift. They are built with a process. The most reliable model has exactly three parts, and if you practice only one thing, practice this loop:

1. **Intent.** Know what you actually want this conversation to change. One clear goal, before you open your mouth.
2. **Structure.** Order your message so the other person can follow it: situation → point → ask, or a plain "here's what, here's why, here's what I need."
3. **Craft.** Choose words and tone for the listener, not for yourself. Cut the filler; say the thing in the fewest words that still land.

Most people skip to step three and wonder why they're not persuasive. It's the first two that do the work.

## The leader's error: assuming intent is shared

Here is the mistake that costs the most: assuming people heard what you meant. They heard what you said. So always close the loop — after a meeting, a pitch, or a big ask, restate the decision in one sentence: "So to confirm — you're taking X by Friday, I'm taking Y by Tuesday." Confirmation turns a conversation into a commitment.

## Listening is the sharpest tool

You cannot communicate with a person you haven't understood. And understanding comes from asking questions you don't know the answer to:

- Ask open questions that begin with what, how, why — questions that can't be answered in one word.
- Ask one question at a timeholiday and actually wait. Silence after your question is not a failure; it is the other person thinking.
- Reflect back what you heard in your own words before responding. "It sounds like the real blocker is X — is that right?" This one habit upgrades every conversation you have, at work and everywhere else.

## Turn your next conversation into practice

Your assignment this week is not theory. It is three real conversations, each about something that matters to you:

1. **One you're dreading** — a tough topic or ask you've been avoiding. Prepare your intent and structure; then have it.
2. **One where you need a yes** — a request for help, time, a favor, or a decision.
3. **One where you're helping someone else** — an explanation, a difficult message, a coaching moment.

In each, run the loop: state your intent, structure your message, listen until the other person feels heard, and close with a confirmation of what was agreed.

## What done looks like

When you finish this lesson you will be running the intent–structure–craft loop automatically, and you will have held three real conversations that ended in clear commitments instead of vague goodwill. That is the difference between "good with people" and "people move because of me."

Next, we apply the same loop to the way you present yourself and your work — the story you tell that makes people want you on the team.
$$klagon$$),
  ('Build Your Career Roadmap', 'Build Your Career Roadmap — Getting Started', $$klagon$$
You have probably been told to "just follow your passion." It is terrible advice. Passion tells you what you enjoy, not what the world will pay you for. This course builds the thing passion never gives you: a career roadmap — a deliberately chosen path to work you're good at, that you enjoy enough to sustain, and that people actually pay for.

## The three circles you must overlap

A career that works sits in the middle of three circles. Do not pick one circle; all three must overlap, or you will burn out, starve, or both.

1. **What you're good at.** Your strengths, skills, and the things that come naturally.
2. **What you enjoy.** The activities you'd do even without pay — or at least without hating.
3. **What the market will pay for.** Real, specific work that employers, clients, or communities pay real money for.

The gap where all three overlap is narrow, and digging toward it is the entire project of this course. Most people only ever explore the first two circles and wonder why passion doesn't feed them.

## The two-step roadmap: explore, then commit

You won't know your overlap from a multiple-choice quiz. You learn it by doing, in two deliberate phases:

- **Explore (this week).** Run small, low-risk experiments across one or two adjacent fields you're curious about. Try a small real project, an online course, an informational conversation with someone working there, or a volunteer task in that field. Collect what lit you up and what drained you.
- **Commit (next).** Once you have evidence, not opinion, choose one lane. Then build deliberately toward it: the skills, the proof, the people, the opportunities.

Exploration without commitment is a dabbler's hobby. Commitment without exploration is a gamble. Do them in order.

## The informational interview

The cheapest, fastest evidence you can get about a career is a 20-minute conversation with someone already doing it. Ask for it plainly: "eline — could I ask you four questions about what your work is actually like?" People are far more willing than you expect.

Four questions that do the work:

1. "What does a typical day actually look like?" (not the job ad version)
2. "What's the best part of the work, honestly?"
3. "What's the part people don't realize?"

4. "If you were starting today, where would you start?"

Write down what they say. Nothing you learn from a brochure beats this.

## What done looks like

By the end of this lesson you will have:

1. Written your own three circles separated into what you're good at, what you enjoy, and what the market pays for.
2. Run one small exploration experiment in a field you're curious about.
3. Held one informational conversation with someone doing work you might want — and written down what you learned.

Choose with evidence, then commit with faith. That's a career roadmap, and it will outlast any single job.

Next, we turn your roadmap into a plan of action — the actual steps and timeline that turn "someday" into a date on the calendar.
$$klagon$$),
  ('Start Your First Business', 'Launch a Real Side Business in 90 Days — Getting Started', $$klagon$$
Welcome. This is the 90-day plan to turn a real side business into a source of income you can actually see in your bank account — not another "build in public, hope for the best" course. This first lesson is about the **one idea** you will bet these ninety days onholiday, and it has one rule above all others: **you will not wait — you will build, in public, every single week.**

## How the 90 days are structured

The plan runs in four phases, each roughly three weeks long.

- **Weeks 1–3 — Find and verify.** You hunt for a painful problem worth solving and stop at nothing until real people confirm it hurts.
- **Weeks 4–6 — Build one thing.** You pick a single idea in a real niche — a real business where you genuinely help one type of person.
- **Weeks 7–9 — Sell and collect.** You put a price on it, publish an offer, and get the first real payment from a stranger.
- **Weeks 10–12 — Rebuild and repeat.** You turn what worked into repeatable systems and prove it with the numbers.

## What "real side business" means here

We are not building a fantasy. A real side business means three things, and we check all three before the capstone:

1. **You sell value.** A stranger, not your mom, pays you for something that improves their life.
2. **The numbers are real.** Payments, receipts, and records — actual money, actual proof, recorded like a professional.
3. **It can be repeated.** A one-off favor is not a business. A repeatable offer is.

## Your one job for the next 90 days

Pick a fixed time slot — two hours, three times a week, in the evening or early morning. Put it in your calendar like a doctor's appointment and protect it. Show up even when you're tired. Businesses drop not on motivation but on missing micro habits.

## What you'll do in this first lesson

Your first task is to find and lock your **starting lane** — the slice of the market you know best. Not "everyone," not "the whole of Ghana," not "small businesses in general." One specific person with one specific problem.

Then begin the habit that powers everything: **talking to real people.** Before you build anything, you will interview at least one real person in your lane and write down, verbatim, the sentence that proves the problem is real.

That sentence is worth more than the entire rest of the course. Write it down and keep it.

## What done looks like

By the end of this lesson you will have:

1. Your one-sentence business idea — specific enough that it could not apply to anyone else.
2. A fixed 2-hour × 3× / week time slot on your calendar.
3. At least one real interview completed, with the person's own words recorded verbatim.

90 days from now you'll have proof, a product, and a paying customer. This is where it starts — with one honest person telling you the truth about their problem.
$$klagon$$),
  ('Start Your First Business', 'Find a Problem Worth Solving', $$klagon$$
Last lesson you picked your lane. Now we go deeper: what problem, in that lane, is worth your next ninety days? The difference between "a business" and "a failing side project" is almost always decided here — in whether the problem you chose is painful enough for strangers to pay to make it go away.

## The three tests of a real problem

A problem is worth building on only if it passes all three tests. If it fails even one, keep searching — do not start building.

1. **Frequency.** Does it happen often? A problem that recurs weekly is a business; a problem that happens once a year is a feature request.

2. **Pain intensity.** How much does it cost when it happens — money, time, health, or stress? The sharper the pain, the faster people pay.

3. **Willingness to pay.** Do the people who feel this pain already spend money or time trying to fix it? If they do, you're selling them something they already want. If they don't, you're trying to create a market — the hardest possible business.

## Where real problems hide

You won't find them in your imagination. Three places, in order:

- **In conversations.** Real people, especially the ones you already know in your lane, complaining about their week. Listen for the complaint that comes up again and again.
- **In complaints already being typed.** Support forums, Facebook groups, Reddit, review sections, and WhatsApp groups. People type out their pains for free, daily. That's research, not eavesdropping.
- **In what people already pay for.** Follow the money. If people are already paying for a fix that doesn't fully work, you don't have to convince them a problem exists — you just have to sell them a better fix.

## The interview that finds it

This is the most important skill in the whole course, so do it properly:

- Talk to **at least one real person** in your lane this week — face to face, by phone, or by call.
- Ask them to **describe their day**, not to brainstorm ideas. "Tell me about last week — what took the most time? What frustrated you?"
- Ask "**and then what happened?**" until they go from vague to specific.
- Write down **verbatim** the single sentence where they name the pain. Their words, not your summary.

## The benchmark

Here's the number you're hunting for: out of 15 real conversations in your target market, **at least 7 people describe the same painful problem in their own words.** If you have that, you have validated demand. If you don't, keep hunting — do not move on until you do.

That benchmark is the boundary between a guess and a market. And it's the reason this whole lesson exists: **resist building until the market has told you what to build.**

## What done looks like

By the end of this lesson you will have:

1. Your problem statement that passes the three tests.
2. At least one real conversation recorded, with the person's verbatim words.
3. A document of evidence — the complaints, the proof of payment, the interview notes.

Next, we take the validated problem and pick the single offer you will build around it.
$$klagon$$),
  ('Start Your First Business', 'Pick One Idea and Back It with Evidence', $$klagon$$
You've found a problem people keep naming, in their own words. Now you face the moment that separates the serious from the browsers: you freeze the scope and pick exactly one idea — one customer, one offer — and then you back it with **proof** until it's undeniable.

## Why you must pick now

Endless option-gathering feels productive — every new idea feels safer than committing to one. But it's an illusion. Choosing, and betting your limited ninety days on the choice, is the only way to create real evidence. An uncommitted browser chews through its calendar without ever producing a customer.

Your one idea must satisfy three tests:

1. **It hurts.** Problem evidence from your conversations — a recurring pain someone described in their own words.
2. **It pays.** Existing money is already spent, or people already spend time trying to relieve this pain today.
3. **You can serve it.** You know more about this niche than the average person, or you can learn fast and show real expertise.

If you can't check all three, the idea is still a fantasy. Reject it now and look again — cheaper than rejecting it at week eight.

## The one-line idea formula

A real idea fits this shape:

> **For [specific customer], who [specific pain], my [offer] gives [specific outcome], without [common objection].**

Narrow until it feels uncomfortable:

- Not "homeowners" — a "first-time homebuyer under 30 in the suburbs who got pre-approved last month."
- Not "small businesses" — "a solo accountant with one client bigger than all the others."
- Not "teachers" — "a high school teacher grading 120 homework sets a week."

This specificity is your superpower. It lets you market, price, and sell with precision that broad competitors can't match.

## Evidence — the three kinds you collect this week

You're not picking on a whim. This week you collect three layers of proof, in this order:

**1. Problem evidence.** Take your strongest verbatim complaint and write it as a one-paragraph story with numbers — how often it happens, how much it costs them. This is the anchor content of your offer.

**2. Demand evidence.** Find proof people actively search for or pay for this: subreddits, forums, marketplaces where the service is bought and sold, job posts, or competitors already charging for a similar fix. Collect five real examples with links.

**3. Ability evidence.** One example that shows you're credible on this problem: a project, a result, a testimonial, or a small experiment you ran. If you don't have one yet, run a tiny one this week.

## Your one experiment, this week

Spend two focused sessions this week on a scrap of an offer for your specific customerholiday and send it to three warm people. Ask a single question: **"If this solved your [pain] in a month, would you pay for it today?"** Write down all three answers verbatim — their words, unedited — and keep them. What people say about money is closer to proof than any survey.

## What done looks like

When this lesson is complete you will have, in a single document:

1. One sentence: the one-line idea formula filled in with real specifics.
2. A one-paragraph problem story with numbers.
3. Five real demand examples with links.
4. One ability artifact.
5. Three recorded answers to your "would you pay" question.

That document is your proof. It's the pilot light of everything we build next. Bring it with you — in the next lesson we price the offer without guessing.
$$klagon$$),
  ('Start Your First Business', 'Price It Without Guessing', $$klagon$$
You have a validated problem and evidence it's real. Now the question every new owner gets wrong: **how much do you charge?** Most people pick a number by feel — "that seems fair," a round number, what a friend said. That's how you undercharge, overwork, and quit. This lesson teaches you to price without your gut.

## The only pricing rule that matters

Price is not cost-plus-margin. Price is the **value of the outcome** — what your customer gains (or loses) by not having their problem solved. Every pricing method below is a way to measure that value.

## Method 1 — The value math

For a business customer: what is the pain actually costing them?

- **Time cost.** Hours per month multiplied by their hourly rate. If a solo therapist spends 8 hours a month on copy they hate at a realistic $80/hour, that's $640 of their productive time chasing the thing you solve.
- **Money lost.** Missed revenue, refunds, or churn caused by the pain. Count it.
- **Risk / stress.** Hard to price, but real. When the stakes are professional embarrassment or burnout, people pay well to make the pain disappear.

**Your rule:** if the problem saves or earns them at least 3× your price in a year, you are not overcharging — you're underpriced. Price the value, not the effort.

## Method 2 — Anchoring from what's out there

You aren't the first to offer value — good news. Find comparables: freelancers, agencies, courses, templates — and note the range.

- Write down the **low**, the **typical**, and the **premium** price in your lane.
- Position relative to them by evidence, not by being cheapest. Cheapest is a race to the bottom you will lose.

## Method 3 — The willingness-to-pay conversation

This produces the most accurate numberholiday. In a real conversation, don't ask "would you buy this?" Ask:

- "What would you pay to never deal with this again — if it genuinely worked in a month?"
- "What do you currently spend on this problem across tools, time, and help?"

Then anchor your price just below their own stated value. People underprice their own pain; your job is to land at a price that still feels like a steal.

## Set your price floor and ceiling

Take all three methods and write down:

- **Your floor** — the price below which it isn't worth your time. Respect it.
- **Your ceiling** — the price at which you'd be embarrassed to ask. Push one step past comfort.
- **Your anchor** — the price you'll actually quote, usually 60–70% of the way between floor and ceiling, rounded to a confident number ($97, $147, $297 — never an awkward $289).

For a first offer, bias slightly low — but never under your floor. A slightly-low price buys testimonials; selling at a loss buys burnout.

## Script it so you never hesitate

Write down word-for-word how you'll say the price when asked: "The price is $147, and it includes the full welcome page plus one revision round — for most people it removes a whole month of writing they hate." Then practice it out loud until it feels like a normal, proud number. Hesitation reads as uncertainty; uncertainty reads as cheapness.

## What done looks like

By the end of this lesson, commit to paper:

1. The value math: what your offer is worth to one customer per year.
2. The anchoring range: low, typical, premium in your lane.
3. Your customer's own stated willingness-to-pay, quoted verbatim.
4. Your floor, your ceiling, and the exact **anchor price** you will quote this week.

That number is now committed. In the next lesson you go sell your first one.
$$klagon$$),
  ('Start Your First Business', 'Sell Your First One', $$klagon$$
Everything so far has been preparation. This is the week you stop planning and actually sell — you put your offer in front of a real stranger with a real price, and you collect your first payment and your first testimonial. The goal is not "go viral"; it is not "thousands of views." It is one real sale from a stranger who hands you money because your offer helped.

## Reframe what selling is

Most people freeze because they think selling is pressure, manipulation, or begging. None of that. Selling, done honestly, is a **service of clarity**: you help a person who already feels pain understand exactly what your offer does, and decide.

Your customer is not the enemy. They are the person who wants to stop hurting and has been waiting for a clean solution. Your job is to reach them, be clear, and make it easy to say yes.

## The one-sentence pitch, polished

Take the offer sentence from lesson two and sharpen it until it takes three seconds to say:

> **For [customer], who [pain], my [offer] gives [outcome] without [objection].**

Three rules for a pitch that actually sells:

1. **Lead with the customer, not you.** "I'm a freelancer who..." puts the spotlight on you. "For solo therapists who hate writing copy..." puts it where it belongs.
2. **Name one specific outcome, not a feature list.** Outcomes sell; features are furniture.
3. **Preempt the one doubt.** If people usually worry about price or effort, address it in your own words before they ask.

## Where your first buyers are

You don't need an audience of ten thousand. You need ten people who trust you. Rank your channels:

1. **Warm introductions.** People you already know in that niche — colleagues, former clients, community members.
2. **Your own small network.** Friends of friends in the right niche beat a cold ad.
3. **The community that hosts the problem.** The forums, groups, and threads where your target talks — show up with value first, answer genuinely, do not spam.
4. **One direct, personalized offer.** For every ten targeted people you message personally, expect two or three real conversations.

## The message that gets replies

Generic outreach dies. A personalized message follows a shape:

- **A nod to them first:** "I read your comment about [their words] on [where]."
- **Your proof of relevance:** "That exact problem is why I built what I'm offering."
- **A soft, specific ask:** "Would you have twenty minutes this week to look at it and tell me if it's useful for [their situation]? No pressure to buy."

Short, specific, low-pressure. One link or none.

## Handling "no"

You will be told no. That's tuition for getting to yes.

- A no is **not** a rejection of you; it's information about fit — the person, the price, the timing, or the message.
- Collect the no's. A candid "this isn't for me" is gold — it tells you how to sharpen the pitch.
- Keep the funnel moving: for every no, send another yes-worthy message. The people who quit at the first no never get a sale.

## The ask that turns interest into a sale

When someone is interested, don't soft-pedal the price — you already decided it. Be clear and confident: restate the outcome, state the price, state what's included, and give a specific next action with a deadline. "I have two slots this week — if it works, reply before Thursday and I'll get started." A real deadline beats invented urgency.

## What done looks like

By the end of this lesson you will have sent your offer to at least ten targeted people, had at least two real conversations, and made your **first sale — a real payment from a stranger** — or, if not yet, five recorded "no's" and a sharper pitch to run again this week.

Do not move on with zero attempts. Send the messages. The sale is at the other end of the send.
$$klagon$$),
  ('Start Your First Business', 'Keep the Money Straight', $$klagon$$
You made a sale. Money has arrived. Now comes the part that breaks most side businesses: **getting the money straight.** Messy money is the silent killer. Tidying it costs an afternoon, not a disaster — and it's how a side project becomes a serious business you can grow and someday tax honestly.

## Choose one home for the money

Open a dedicated **business account** — most are free, and a plain one is perfect. Route every business dollar — income and expense — through it, and only through it.

This gives you:

- **A truthful number.** You can answer "how much has my business made and spent?" in seconds.
- **Clean habits.** When money is separate, taxes and real margins become trivial.
- **Grown-up optics.** A business account moves you from "side hustle" to "real thing" in your own eyes and your customers'.

## Track it like it's a job

Keep four numbers, updated weekly — a simple spreadsheet is plenty:

1. **Revenue** — total money in at your price point.
2. **Costs** — real, out-of-pocket expenses for the tools, software, ads, and things you paid for.
3. **Gross profit** = revenue minus costs. This tells you whether the business works.
4. **Time spent** — your hours, because your real "hourly wage" is gross profit ÷ hours.

Update these every Sunday. Five minutes. If a number surprises you, that surprise is the entire point of tracking.

## Watch the two traps

- **The "someday tax" trap.** Failing to set aside for taxes. Money that looks like profit isn't all yours. Rule: set aside **25–30% of every payment** into a separate savings bucket the moment it lands. At tax time you send it and keep your sanity.
- **The "tools creep" trap.** Spending more on tools and software than you ever make. A $40/month tool that saves an hour a month is often a losing trade. Audit every recurring subscription; cancel anything that doesn't pay for itself.

## Pick your business structure — without panic

You don't need fancy incorporation today. Here's the honest ladder:

- **None (sole proprietor)** — fine for your first sales almost everywhere. Your business income simply goes on your taxes. Zero cost, start here.
- **LLC / limited liability** — worth it later for protecting personal assets, usually once you have real revenue or real legal exposure. Not required on day one.

Either way, do three things this week: the dedicated account, keep your costs in it, and set aside taxes. **Structure can catch up; clean books can't wait.**

## What done looks like

By the end of this lesson:

1. A dedicated business checking account with revenue and costs running through it.
2. A weekly tracker listing revenue, gross profit, and hours — updated once.
3. A tax bucket holding 25–30% of payments received and a list of recurring tools, with the losers cancelled.

Your money is straight — the business is honest, you sleep better, and you can see exactly what to scale. Next, we turn one-off success into something repeatable.
$$klagon$$),
  ('Start Your First Business', 'Make It Repeatable', $$klagon$$
You have a first sale and honest books. But right now you have a one-off success, not yet a business. A business is a **repeating machine**: the same thing working for more customers, more predictably, with less chaos. This lesson turns your win into a repeatable process — the step most side businesses never take, and the reason they stay stuck at "one lucky sale."

## Why "repeatable" is the whole game

A one-off feels great but isn't a foundation. You can't grow a business that depends on luck, heroics, or getting it right from scratch each time.

Repeatable means:

- Someone else (or future-you following a checklist) can deliver the same result with the same quality.
- New customers get the same great outcome, not a coin flip.
- You know your cost, your time, and your margin for every unit.

## The replay: go back to the day you made the sale

The best way to find a repeatable process is to **replay what actually happened on the day you made the sale.** Take a blank page and write the real steps in order:

- Where did the customer come from? Which message, channel, or introduction?
- What exactly did you show them?
- How did you move them from interest to payment? What did they ask, and what did you say?
- What did you deliver, and in how many steps?
- What did they say afterward?

That log is your first draft of the system. It worked once — now make it repeatable.

## Turn the log into a checklist

From that draft, build a **checklist**: the fixed sequence from first contact to delivered outcome. This is your operating manual.

- Step-ordered and specific ("Send follow-up email 24 hours after payment," not "follow up").
- Short enough to actually follow — under 20 steps for a service offer.
- Versioned — every time you change the process, update the checklist so the new way becomes the default.

The checklist is how you deliver consistent quality without reinventing anything, every single time.

## Codify the part that floats

The frustrating part of a first sale is the stuff that "just happened" — the phrasing that felt natural, the flow you stumbled into. Repeatability means capturing it:

1. **Your pitch wording** — freeze the exact sentences that got the yesholiday and the replies that handled the objections. Store them as templates, not memories.
2. **Your delivery steps** — write down precisely what you deliver first, second, third.
3. **Your follow-up cadence** — when you check in and what you send. This is where repeat orders and referrals live.

You're not being robotic; you're preserving what works so it survives without you.

## Set the quality bar

Define "done well" in measurable terms — the bar every delivery must hit. Example: "The customer can use the deliverable within 48 hours without asking questions," or "They say they'd recommend it."

Write it down. It's your product spec, your testimonial generator, and your defense against scope creep.

## Start delegating a slice

You may not have staff yet — fine. Repeatability sets you up to hand off eventually. Start humbly: the moment a step is fully written down (so it can literally be done from a checklist), ask a trusted helper to do one small slice, or simply reduce your time by batching.

The test of a truly repeatable process: **could you stop doing it and describe it so clearly that someone else could reproduce the result?** If yes, you're no longer selling your hours — you're operating a machine.

## What done looks like

By the end of this lesson you will have, in one document:

1. The replay log of your real first sale.
2. A versioned delivery checklist (under 20 steps).
3. Frozen wording: the pitch, the objection replies, the follow-up cadence.
4. A written "done well" quality bar.
5. One test of repeatability — either you delivered the same result to a second buyer, or you described it well enough that someone else could.

With the machine built, one last thing remains: proving to the world that this is real. That's the capstone.
$$klagon$$),
  ('Start Your First Business', 'Capstone — Your Proof', $$klagon$$
This is the capstone. Ninety days in, you've done the thing 99% of dreamers never do: you built a real side business and made real money. Now you turn it into **proof** — proof so undeniable that a bank, an employer, an investor, or your own confidence can't argue with it. Keep it tight: this is a wrap-up, not new material.

## Gather your real numbers

Open your weekly tracker — the one you built in the money lesson — and pull the honest numbers:

- Total revenue and total gross profit.
- Number of paying customers.
- Your costs, and your real hourly wage for the time spent.
- The one or two numbers that make the effort feel real, however small.

Small is fine. What matters is that the numbers are true and you can say them out loud without flinching.

## Assemble the proof

Build a single Proof document, in this order:

1. **The problem.** Your one-sentence idea — customer, pain, outcome.
2. **The proof it was real.** Your verbatim customer quotes and demand evidence.
3. **The offer.** What you sold, at what price, and the value math that justified it.
4. **The results.** Your real revenue, customers, and whatever social proof you have — a testimonial or a reply.
5. **The machine.** The repeatable checklist showing this isn't luck.

## Write the three-sentence summary

If someone asks "so what did you do?", answer in three sentences:

1. "I found [customer] who struggle with [pain]."
2. "I built and sold [offer], and [number] of them paid me."
3. "It's repeatable because [checklist], and I made [gross profit]."

Practice it until it feels easy. That one-liner is yours forever — for a resume, a portfolio, or any opportunity.

## Deploy your proof

Proof that stays in a folder does nothing. Do three things this week:

- **Show it where it counts.** Post the result — real numbers, honestly — where your market is, or add it to your portfolio.
- **Tell one specific person.** A future client, a friend who could refer you. Tell them the three-sentence story live.
- **Save it as a reusable asset.** Keep the Proof document; it feeds your pitch, your portfolio, and your confidence forever.

## Decide the next 90 days

Last, a choice, made deliberately:

- **Run it again.** The machine works — grow it: raise the price, add the second offer, batch more customers.
- **Fold with pride.** You proved you can start, sell, and deliver — a skill that is portable and permanent. Deciding to stop is legitimate.

Refuse the worst option: doing nothing and letting the proof rot. Whatever you choose, choose it on purpose.

## The finish line

This is not the finish line — it's proof you can start. You now own verified evidence that you can find a problem people care about and solve it well enough that a stranger paid you. Everything else — the next idea, the next business, the raise, the promotion — is running the same machine you just proved.

Ninety days done. Now go do the next one.
$$klagon$$)
)
update public.lessons l
set content = src.body
from lesson_content src
where l.id = public.lookup_lesson(src.c_course, src.c_lesson);

drop function public.lookup_lesson;

-- ============================================================
-- Verify (safe to run): expect 13 rows with has_content = true.
-- ============================================================
-- select title, (content is not null) as has_content
-- from public.lessons order by sort_order;
