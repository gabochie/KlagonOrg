-- ============================================================================
-- SPRINTS #2 AND #3 — Side-Business + Freelance (impulse pricing)
-- 'Start Your First Business' (8 full lessons) already priced GH₵150 in
-- 20261007000000; re-assert here idempotently. 'Get Ready for Your First
-- Job or Client' stays FREE as the funnel on-ramp.
-- New: 'Get Your First Client as a Freelancer — PRO Sprint' @ GH₵100
-- with 5 full phone-first lessons. Sales pages: /go/side-business, /go/freelance.
-- Re-runnable: YES. Destructive: NO.
-- ============================================================================

update public.courses
set price_ghs = 150
where title = 'Start Your First Business'
  and (price_ghs is null or price_ghs <> 150);

insert into public.courses (title, category, icon, description, published, price_ghs)
select
  'Get Your First Client as a Freelancer — PRO Sprint',
  'Career',
  '🧭',
  'A 2-week, phone-only sprint. Position one offer, send 20 outreaches, invoice on MoMo, deliver job one. GH₵100 one-time, lifetime access.',
  true,
  100
where not exists (
  select 1 from public.courses
  where title = 'Get Your First Client as a Freelancer — PRO Sprint'
);

-- ---- Freelance Lesson 0: One offer, one buyer ----
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'One offer, one buyer', 20, $lesson$# One Offer, One Buyer

**Goal:** leave with a single-sentence offer aimed at a single type of buyer.

## 1. Inventory your skills (15 min)

List everything people already ask you for: design, writing, phone repair, hair, tutoring, errands, social-media help. Circle the three you could deliver this week on your phone.

## 2. Pick one buyer

A freelancer with three buyers has no message. Pick the buyer who pays fastest near you: shop owners needing flyers, students needing tutoring, busy parents needing errands. Name them precisely: "boutique owners in Lashibi," not "small businesses."

## 3. Write the offer sentence

"I help [buyer] get [result] in [time] for [price]." Example: "I help Lashibi boutiques get a WhatsApp catalogue in 48 hours for GH₵150." If a stranger cannot repeat it back, rewrite it.

## 4. Price for the first yes

Your first price buys proof, not profit. GH₵50–150 for job one is fine. Raise after three paid jobs. Never work free "for exposure" — discounted, invoiced, and paid, even if small.

**Evidence to submit:** your offer sentence plus the buyer definition.
$lesson$, 0
from public.courses c
where c.title = 'Get Your First Client as a Freelancer — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

-- ---- Freelance Lesson 1: Proof kit on your phone ----
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Proof kit on your phone', 20, $lesson$# Proof Kit on Your Phone

**Goal:** a 3-item proof kit a buyer can check in 60 seconds.

## The three items

1. **Before/after** — one photo pair of anything you made, fixed, or improved. No portfolio site needed.
2. **One testimonial** — a WhatsApp voice note or screenshot from anyone you helped, even unpaid family work. Ask: "Can I quote you in one line?"
3. **One sample** — make a free sample for your exact buyer type: a flyer for an imaginary boutique, a 200-word product description, a price-list sheet.

## Assemble it

One phone folder, one WhatsApp catalogue section, or one Google Doc link. A buyer who cannot find proof in one tap moves on.

## Borrowed proof (honest version)

No clients yet? Say so, then show the sample: "No paying clients yet — here is what I made for a boutique like yours this week." Honesty plus a sample beats silence.

**Evidence to submit:** link or screenshots of your 3-item proof kit.
$lesson$, 1
from public.courses c
where c.title = 'Get Your First Client as a Freelancer — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

-- ---- Freelance Lesson 2: 20 outreaches in 5 days ----
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, '20 outreaches in 5 days', 25, $lesson$# 20 Outreaches in 5 Days

**Goal:** 20 real outreaches sent (4 per day), tracked in a sheet.

## The message (4 lines)

1. Their name and one specific thing you noticed ("Your new arrivals post got good comments").
2. The problem it hints at ("but no price list in your bio").
3. Your offer in one line.
4. One low-pressure question ("Want me to mock up one page free so you can see?").

## Where to send

Walk-ins beat DMs in Klagon: visit 2 shops a day with your phone proof kit ready. Online: WhatsApp Business, Instagram DMs to local vendors, the KLAGON.org jobs board. Four a day, five days. No zero days.

## Track everything

Sheet columns: name, where, date, message sent, reply, follow-up date. Outreach without tracking is wishing.

## Follow up once

No reply in 3 days gets one polite nudge with something new attached (a fresh sample, a price). Then move on. Fortune is in the follow-up, pestering is in the third message.

**Evidence to submit:** your tracking sheet with 20 rows plus your 4-line template.
$lesson$, 2
from public.courses c
where c.title = 'Get Your First Client as a Freelancer — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

-- ---- Freelance Lesson 3: Invoice on MoMo, deliver job one ----
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Invoice on MoMo, deliver job one', 20, $lesson$# Invoice on MoMo, Deliver Job One

**Goal:** a paid job agreed, half collected, delivered, balance collected.

## The agreement (before work starts)

WhatsApp message both sides keep: scope in one line, price, half upfront, delivery date, one revision included. "Half to start, half on delivery" is the Ghana freelancer shield — no exceptions for strangers.

## Collecting on MoMo

Send your MoMo number with the exact amount and the job name. Confirm receipt before starting. Screenshot confirmations into your records sheet. Never start on "send it after."

## Deliver and close

Deliver on the date, even if imperfect. Ask for the balance plus two things: a one-line testimonial and one referral name. Job one is worth three assets: money, words, and the next lead.

## Red flags

Rush job with no deposit, "big exposure" instead of pay, scope that grows after agreement, anyone asking for your MoMo PIN (never share it — real payments never need it).

**Evidence to submit:** your agreement template plus records of job one (amounts, dates).
$lesson$, 3
from public.courses c
where c.title = 'Get Your First Client as a Freelancer — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;

-- ---- Freelance Lesson 4: Showcase + certificate ----
insert into public.lessons (course_id, title, duration_min, content, sort_order)
select c.id, 'Showcase + certificate', 20, $lesson$# Showcase and Certificate

**Goal:** a freelancer page you can send to any buyer.

## 1. One-page showcase

Your offer sentence, proof kit highlights, outreach numbers (20 sent, replies, jobs), job-one story with amounts. One page, phone-readable.

## 2. Two-minute intro

Record on your phone: who you help, your proof, your price. No face needed — screen plus voice works.

## 3. Submit both

Reviewed within 48 hours. Pass earns a verifiable certificate (check it at klagon.org/verify) plus the Skills Passport badge. Fail gets personal feedback and one free retry.

**Evidence to submit:** showcase page plus intro link.
$lesson$, 4
from public.courses c
where c.title = 'Get Your First Client as a Freelancer — PRO Sprint'
on conflict (course_id, sort_order) do update
set title = excluded.title, duration_min = excluded.duration_min, content = excluded.content;
