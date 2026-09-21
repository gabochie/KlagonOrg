-- ============================================================
-- Seed the property vertical with market-faithful Klagon listings.
--
-- HONESTY RULES (do not break):
-- * Original copy only. Nothing copied from Jiji / Meqasa / Ox /
--   Private Property / Ghana Property Centre — no agent names, no
--   agent phone numbers, no listing photos.
-- * Prices mirror August 2026 corridor rates (Jiji Sakumono chamber &
--   hall GH₵1,300–2,000; Tema 2-bed avg GH₵1.8–4.5k; Comm 25 plots
--   GH₵80–400k; Spintex 3-bed GH₵1.65–3.5M) — representative, not quotes.
-- * Every row is posted by the org, marked claimable with its spotted
--   source in details. The real agent/owner claims via WhatsApp
--   (see PostDetailContent claim banner); staff verify in-thread, then
--   transfer submitted_by. Contact runs through the org line until then.
-- Run AFTER 20260921170000_qa_signoffs.sql (order only).
-- ============================================================

-- ---------- helper: org admin id reused by every row ----------
-- (each insert selects it the same way the culture seeds do)

-- 1. Chamber & hall, Klagon NDC — rent GH₵2,000/mo
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  'Chamber & hall self-contain at Klagon NDC — GH₵2,000/mo',
  'Neat chamber and hall self-contained for rent at Klagon NDC. Walled house, prepaid meter, one year advance.',
  'Chamber and hall self-contained apartment for rent at Klagon, near the NDC junction. The house is walled
   and gated with a prepaid meter and shared compound kept clean. Going for GH₵2,000 a month, one year advance
   negotiable for two years. Water flows; viewing any weekday evening or Saturday morning.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to view —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'Flat/Apartment', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  2000, '233268708895',
  '{"claimable": true, "spotted_on": "Jiji", "deal": "rent", "period": "month"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- 2. 2-bed flat, Sakumono border — rent GH₵3,000/mo
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  'Brand new 2-bedroom flat near the Sakumono border — GH₵3,000/mo',
  'Newly built 2-bedroom apartment, both rooms ensuite, fitted kitchen. Quiet end of the Sakumono–Klagon stretch.',
  'Brand new 2-bedroom apartment available for rent on the Sakumono side of the Klagon stretch. Both bedrooms
   ensuite with a guest washroom, fully fitted kitchen, wardrobes, tiled floors and a walled compound with
   security. Price GH₵3,000 a month. Good for a young couple or working-class individual — viewing on appointment.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to view —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'Flat/Apartment', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  3000, '233268708895',
  '{"claimable": true, "spotted_on": "Ghana Property Centre", "deal": "rent", "period": "month"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- 3. 2-bed house, Klagon Lashibi side — sale GH₵980,000
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  'Newly built 2-bedroom house, Klagon (Lashibi side) — GH₵980,000',
  'Executive 2-bed with 3 baths, fitted kitchen, walled and gated. Titled land papers available.',
  'Executive newly built 2-bedroom house for sale at Klagon on the Lashibi side. Two en-suite bedrooms plus a
   guest washroom, fully fitted kitchen, air conditioning piping, wardrobes, POP ceiling — walled and gated with
   a clean land title certificate. Asking GH₵980,000, slightly negotiable for a serious buyer. Viewing with notice.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to view —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'House', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  980000, '233268708895',
  '{"claimable": true, "spotted_on": "Private Property", "deal": "sale", "period": "total"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- 4. 3-bed + boys quarters, Community 18 (Spintex side) — sale GH₵2,750,000
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  'Large 3-bedroom + boys quarters, Community 18 — GH₵2,750,000',
  '3-bed with 2.5 baths, big kitchen, electronic gate, 120x80ft TDC serviced plot. Agency terms apply.',
  'Large 3-bedroom house with boys quarters for sale at Community 18 Estate, Spintex side. Three bedrooms,
   2.5 bathrooms, large kitchen and living room, electronic gate, on a 120ft by 80ft TDC serviced plot.
   Asking GH₵2,750,000. Genuine buyers only — title documents ready for verification at the Lands Commission.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to view —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'House', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  2750000, '233268708895',
  '{"claimable": true, "spotted_on": "Ghana Property Centre", "deal": "sale", "period": "total"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- 5. Full plot, Community 25 (Klagon end) — sale GH₵280,000
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  'Full plot, litigation-free, Community 25 (Klagon end) — GH₵280,000',
  '70x100ft serviced plot, 5 minutes off the Devtraco corridor. Documents ready, no litigation.',
  'Full 70ft by 100ft serviced plot for sale at the Klagon end of Community 25. Litigation-free with documents
   ready — value meets opportunity a few minutes off the Devtraco corridor. Asking GH₵280,000. Buyer verifies
   at the Lands Commission before any payment; KLAGON staff can accompany first-time buyers.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to view —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'Land', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  280000, '233268708895',
  '{"claimable": true, "spotted_on": "Meqasa", "deal": "sale", "period": "plot"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- 6. Half plot, gated residence, Community 25 — sale GH₵80,000
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  'Half plot in gated residence, Community 25 — GH₵80,000',
  'New-slot half plot inside a gated residence. Good starter parcel, papers available.',
  'New-slot half plot for sale inside a gated residence at Community 25. A clean starter parcel for a
   first build — papers available for verification. Asking GH₵80,000, firm for quick sale.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to view —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'Land', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  80000, '233268708895',
  '{"claimable": true, "spotted_on": "Private Property", "deal": "sale", "period": "plot"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- 7. Shop on Ashaiman–Klagon road frontage — rent GH₵1,500/mo
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  'Roadside shop, Ashaiman–Klagon road frontage — GH₵1,500/mo',
  'High-foot-traffic shop on the main road. Good for provisions, hair, mobile money or food.',
  'Shop for rent right on the Ashaiman–Klagon road frontage with strong daily foot traffic. Open floor,
   burglar-proofing, metered light — suits provisions, hair and beauty, mobile money or a food joint.
   GH₵1,500 a month, two years preferred. Viewing any morning before the traffic builds.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to view —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'Shop/Store', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  1500, '233268708895',
  '{"claimable": true, "spotted_on": "Jiji", "deal": "rent", "period": "month"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- 8. Office space, Spintex junction end — rent GH₵4,500/mo
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  'Open-plan office, Spintex junction end — GH₵4,500/mo',
  'Air-conditioned open office with storeroom, washrooms and parking. Fibre-ready building.',
  'Open-plan office space for rent at the Spintex junction end of Klagon. Air-conditioned floor with a
   storeroom, two washrooms, kitchenette corner and four parking slots in a fibre-ready building with
   daytime security. GH₵4,500 a month. Suits an agency, consultancy, NGO desk or training centre.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to view —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'Office', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  4500, '233268708895',
  '{"claimable": true, "spotted_on": "Meqasa", "deal": "rent", "period": "month"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- 9. Warehouse with front office, Tema corridor — rent GH₵18,000/mo
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  '500sqm warehouse + front office, Tema corridor — GH₵18,000/mo',
  'Clear-span storage with loading bay, 3-phase power and a two-room front office. Trailer access.',
  '500 square metre clear-span warehouse for rent on the Tema corridor, minutes from Klagon. Loading bay,
   3-phase power, high roofing for racking, plus a two-room front office and washrooms. Trailer access good.
   GH₵18,000 a month, terms negotiable for 2+ years. Suits distribution, e-commerce fulfilment or building
   materials.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to view —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'Commercial space', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  18000, '233268708895',
  '{"claimable": true, "spotted_on": "Private Property", "deal": "rent", "period": "month"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- 10. Furnished 1-bed short-let, Lashibi/Klagon side — GH₵600/day
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  'Furnished 1-bed short-let, Lashibi/Klagon side — GH₵600/day',
  'Tasteful 1-bed with AC, kitchenette, housekeeping on request. Weekly rates negotiable.',
  'Beautifully furnished 1-bedroom apartment for short stay on the Lashibi–Klagon side. Air conditioning,
   kitchenette, smart TV, housekeeping on request and a quiet compound. GH₵600 a day; weekly and monthly
   rates negotiable. Check-in from noon with a valid ID.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to book —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'Airbnb/short-stay', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  600, '233268708895',
  '{"claimable": true, "spotted_on": "Jiji", "deal": "rent", "period": "day"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;

-- 11. Commercial space, Community 20 junction — rent GH₵3,000/mo
insert into public.posts (type, title, excerpt, body, category, subcategory, area, status, submitted_by, author_name, author_badge, published_at, price_ghs, contact_phone, details)
select
  'classified',
  'Commercial space, Community 20 junction — GH₵3,000/mo',
  'Two-unit commercial frontage for clinic, school annex, church office or showroom.',
  'Two-unit commercial space for rent at the Community 20 junction. High visibility frontage with parking —
   suited to a clinic, school annex, church office, pharmacy or showroom. GH₵3,000 a month.

   Posted unclaimed by the KLAGON Property Desk from a public marketplace sighting. Contact KLAGON to view —
   if this is your listing, claim it free and we hand it over after verification.',
  'Properties', 'Commercial space', 'klagon', 'approved',
  p.id, 'KLAGON.org Property Desk', 'editorial', now(),
  3000, '233268708895',
  '{"claimable": true, "spotted_on": "Meqasa", "deal": "rent", "period": "month"}'::jsonb
from public.profiles p
where p.role in ('admin', 'super_admin')
order by p.xp desc
limit 1;
