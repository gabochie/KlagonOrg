# Demand-Gen Pilot — Offer Brief (mixed cold DB, WhatsApp-first, B2C + B2B)

## 1. Why this pilot
Mixed database → one offer must sell to both sides without two products.
Winner: **AI Productivity Sprint** — the same 5-lesson course, two prices:
- B2C: GH₵150 single seat (`/go/ai-sprint`) — youth, jobseekers, freelancers, shop staff
- B2B: GH₵2,000 / 5 seats + kickoff + report + badge (`/go/ai-sprint-team`) — SMEs

Both run on the existing rails: free account → MoMo via `CourseCheckout` → `PaidCourseGate` → `lead_events` telemetry. No new payments code.

## 2. Segmentation (split the cold list before you touch it)
1. **B2C — Hustlers (18–35):** any youth / student / jobseeker / freelancer contact. Message: save hours, get proof for CVs/clients.
2. **B2B — Owners (shops, salons, schools, clinics, churches):** any business contact incl. the 740 directory listings. Message: staff hours back, paid back in ~6 weeks.
3. **Warm-ish (diaspora / NGO / corporate):** forward the B2B page + sponsor page. Message: fund 10 seats, get impact report.
Scrub: duplicates, dead numbers (HLR/WhatsApp-check), under-16, DNC complaints. Tag every contact with segment + source.

## 3. Pricing logic
- GH₵150 ≈ 1 day's skilled hustle — impulse-able on MoMo, high enough to finish.
- GH₵2,000 ≈ Growth Partner monthly (GH₵2,000/mo) reframed as one-time outcome — familiar anchor, easy upsell to retainer.
- Guarantee: do all 5 lessons in 14 days, show work, saved zero hours → refund via WhatsApp. Caps risk, forces completion.

## 4. Funnel (WhatsApp-first)
Cold broadcast → sales page (`?utm_source=wa-broadcast&utm_campaign=ai-sprint-pilot`) → two exits:
(a) Enrol (free account → MoMo GH₵150), (b) WhatsApp us first (prefilled message).
No-shows get 5-touch sequence (file 01). B2B gets owner sequence + kickoff offer.
Track: `lead_events(source=ai-sprint-b2c|ai-sprint-team, action=whatsapp-click|sales-enrol-click)` — UTM bag auto-attached.

## 5. KPIs (first 500 contacts, 21 days)
- Delivery rate ≥90%, reply rate ≥8%, sales-page CTR ≥25% of replies
- B2C conversion ≥2% of delivered (10 sales = GH₵1,500)
- B2B: 10 calls → 2 closes (GH₵4,000). Pilot pays for itself at 2 B2B + 10 B2C.
- Completion ≥40%, refund ≤10%. Kill/scale rule: if reply <4% after 300 sends, rewrite hook, not the course.

## 6. Compliance (Ghana)
- First message states who you are + why they have you + STOP opt-out.
- One broadcast per contact per 7 days max; honour STOP within 24h; log consent in CRM.
- No MoMo PIN/password requests ever; MoMo prompts only via the site checkout.
