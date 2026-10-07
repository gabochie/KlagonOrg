-- ============================================================================
-- COURSE REALITY — full PRO Sprint lessons + sprint #2 pricing (impulse GH₵150)
-- Replaces the 5 stub lessons on the PRO Sprint with full phone-first copy.
-- Prices 'Start Your First Business' (SOE-VEN-01, 8 full lessons in DB) at
-- GH₵150 as sprint #2. Free 'Automate 3 Tasks at Work with AI' untouched.
-- Re-runnable: YES (upserts). Destructive: NO.
-- ============================================================================

-- ---- PRO Sprint Lesson 0: Pick 3 tasks worth automating ----
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Pick 3 tasks worth automating', 20, $lesson$# Pick 3 Tasks Worth Automating

**Goal:** leave with a ranked list of 3 tasks plus a time baseline you can prove later.

## 1. Brain-dump your week (15 min)

Write down every repeat task you did in the last 7 days. Include the boring ones: MoMo reconciliation, customer follow-ups, quotations, stock counts, daily sales records, reports to a boss. If it happens more than twice a week, it counts.

## 2. Score each task (10 min)

Score 1–5 on three axes and add them up:

- **Frequency** — how often does it happen?
- **Pain** — how much do you dread it?
- **Error cost** — what goes wrong when you slip?

Highest totals win. Do not pick glamorous tasks. Pick the ones that eat your evenings.

## 3. Time your top 5 (2 days)

Use your phone stopwatch for two normal days. Write the baseline plainly, for example: "Quotations: 45 min/day." No baseline, no proof later.

## 4. Ghana filter

Two questions before you commit:

1. Does this task need mobile data to run? If yes, note the offline fallback now.
2. Does it touch customer money or personal data? If yes, it keeps a human checkpoint forever. AI drafts, you approve.

## 5. Commit

Write one sentence: "I will automate ___, ___, and ___ and save ___ hours per week."

**Evidence to submit:** a photo or screenshot of your score sheet plus your baseline times.
$lesson$, 0
from public.courses c
where c.title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

-- ---- PRO Sprint Lesson 1: Prompt like a supervisor ----
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Prompt like a supervisor, not a beggar', 20, $lesson$# Prompt Like a Supervisor

**Goal:** three reusable prompts that produce the same good result twice in a row.

## The formula

Role first, then task, then constraints, then format:

1. **Role** — "You are my shop assistant who writes polite customer messages."
2. **Task** — "Draft a follow-up for a customer who asked for a quotation yesterday."
3. **Constraints** — price list attached, Twi-friendly tone, under 60 words, no promises on delivery dates.
4. **Format** — "Return a WhatsApp-ready message plus a one-row sheet entry."

## Templates to copy

- Quotation reply from a price list.
- Polite 48-hour follow-up after a quote.
- Daily sales summary from rough notes.
- Cover note tailoring one CV paragraph to one job advert.

## Safety rules (non-negotiable)

- Never paste MoMo PINs, passwords, or full customer lists into any AI tool.
- Verify every number before sending. AI invents confidently.
- Run important prompts twice. If the two runs disagree, keep the human version.

## Hallucination drill

Ask your tool for a Tema regulation you suspect does not exist. Watch it invent one with confidence. That feeling is the whole lesson: verify before sending, every time.

**Evidence to submit:** your 3 prompts plus both outputs for each.
$lesson$, 1
from public.courses c
where c.title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

-- ---- PRO Sprint Lesson 2: Build the blueprint ----
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Build your 3-task blueprint', 30, $lesson$# Build Your 3-Task Blueprint

**Goal:** all 3 automations sketched end-to-end with screenshots.

## The free stack (phone-only)

Phone notes, a free AI assistant, Google Docs and Sheets, WhatsApp Business. Everything has a free tier. Everything works on a phone. Note the offline fallback for each step now, while data is available.

## Pattern A — shop quotations

Price list lives in Sheets. Customer asks on WhatsApp. You run the quotation prompt, check the numbers, send in under 60 seconds. Human checkpoint: the totals, every time.

## Pattern B — freelancer follow-up

Brief arrives. Draft the proposal with the prompt template, attach your checklist, set a calendar reminder for day 3. The reminder is the automation most people skip and most need.

## Pattern C — jobseeker tailoring

One master CV. Ten minutes per advert: tailored paragraph plus a tracking-sheet row (company, date, version sent). Volume with tracking beats volume without it.

## Draw each flow

For each of your 3 tasks write: Trigger, AI step, Human check, Send or file. Screenshot every step on your phone.

**Evidence to submit:** blueprint doc with all 3 flows plus screenshots.
$lesson$, 2
from public.courses c
where c.title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

-- ---- PRO Sprint Lesson 3: Go live + measure ----
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Go live + measure hours saved', 20, $lesson$# Go Live for 7 Days

**Goal:** proof, not promises.

## Run on real work

All 3 automations run on real tasks for 7 straight days. Log daily: time taken, errors caught, money or customers touched. One honest line per day beats a perfect spreadsheet you never fill.

## Fix loop

What broke, smallest fix, re-run. Post one fix in the WhatsApp group so others learn. If a fix needs more than 15 minutes, shrink the automation instead of expanding it.

## Privacy + fraud check (same week)

Audit app permissions on your phone. Learn the MoMo-fraud red flags: urgency, secrecy, advance fees, links that skip the official menu. Customer data rule: no customer lists into random tools, ever.

## Before and after

Day 7: compare against your Lesson 0 baseline. Hours saved per week is your headline number. Errors caught is your second number. Money touched is your third.

**Evidence to submit:** the 7-day log plus before/after hours.
$lesson$, 3
from public.courses c
where c.title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

-- ---- PRO Sprint Lesson 4: Showcase + certificate ----
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Showcase + certificate', 20, $lesson$# Showcase and Certificate

**Goal:** an asset you can send to a boss, a client, or an interview panel.

## 1. One-page blueprint

Problem, the 3 flows, hours saved, screenshots. One page. If it needs two pages, cut words, not proof.

## 2. Two-minute demo

Record on your phone: screen plus voice, no face needed. Show one automation running on a real task. State the hours saved out loud.

## 3. Submit both

Review within 48 hours. Pass earns a verifiable certificate (check it at klagon.org/verify) plus the Skills Passport badge. If you do not pass, you get personal feedback and one free retry.

**Evidence to submit:** blueprint PDF plus demo link.
$lesson$, 4
from public.courses c
where c.title = 'Automate 3 Tasks at Work with AI — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

-- ---- Sprint #2 pricing: Start Your First Business @ GH₵150 (impulse) ----
update public.courses
set price_ghs = 150
where title = 'Start Your First Business'
  and (price_ghs is null or price_ghs <> 150);
