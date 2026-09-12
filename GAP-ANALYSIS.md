# KlagonStudios — Production Gap Analysis

Last updated: 2026-09-12
Status: **Static demo (~0% production-ready)** · Target: test launch readiness

## Executive summary

The site is a high-fidelity static demo. Every form is a mock (`e.preventDefault()`),
all data lives in `src/lib/constants.ts`, dashboards are hardcoded UIs, and there is no
backend, auth, database, or payment integration. Estimated work to genuine test-launch
readiness: ~3–5 focused weeks (1–2 devs).

## Current state (facts)

| Area | Found |
|---|---|
| Backend/DB | None. All data hardcoded in `src/lib/constants.ts` |
| Forms | `onSubmit={(e) => e.preventDefault()}` on every form (register, login, donate, sponsor, mentor, contact) |
| Auth | None. Login/register are dummies; `/dashboard/admin` + `/dashboard/member` are static mock UIs |
| Payments | None. Donate/Sponsor end in fake "thank you" |
| Env | `.env.local` has empty `NEXT_PUBLIC_SUPABASE_URL`/`ANON_KEY`, unused |
| Hosting | Static export on `klagon-org.pages.dev`; `klagon.org` zone NOT in CF account |
| Email | Placeholder `hello@stars.klagon.org`, `+233 24 000 0000`, "approved within 24h" — nothing sends |
| Metadata | `metadataBase: https://stars.klagon.org` (wrong domain), no `og:image`, no per-page metadata, no sitemap/robots |
| Analytics/Observability | `error.tsx` exists, no monitoring tooling |
| Security | No auth, no RLS, no bot protection, no rate limits; repo is public |
| QA | No tests, no CI, `lint` script runs `next lint` but eslint is not installed |

## Target architecture

Keep Cloudflare Pages static hosting + backend-as-a-service — no custom server needed.

```
Cloudflare Pages (static)
  ├─ Supabase (Postgres + Auth + RLS + Storage)
  ├─ Cloudflare Turnstile (form bot protection)
  ├─ Moolre (MoMo USSD payments + SMS/WhatsApp) via Cloudflare Worker relay
  ├─ Cloudflare Email Routing + Email (transactional outbound)
  └─ Cloudflare Web Analytics
```

Key decision: **Moolre over Paystack** (user has a Moolre account; Ghana MoMo-first).
Moolre also provides SMS + WhatsApp APIs → replace Twilio for approval notifications.
Private Moolre API keys are used by a small **Cloudflare Worker** relay + webhook receiver,
so the static site never exposes secrets.

## Gap inventory

### P0 — Blocks test launch entirely

| # | Gap | Current | Required work | Effort |
|---|---|---|---|---|
| 1 | No database | Hardcoded constants | Supabase project + schema (members, roles, events, RSVPs, courses, lessons, progress, badges, projects, news, sponsorship, donations, volunteer ops, applications, announcements) + seed + migrations | L |
| 2 | No real auth / RBAC | Dummy forms | Supabase Auth (email+password), role model (member/admin/super_admin), approval workflow, protected dashboards, RLS everywhere | L |
| 3 | Registration does nothing | `preventDefault` | Supabase insert with `approved=false`; duplicate detection (phone/email); admin approve flow; notify | M |
| 4 | Zero payment processing | Fake success screen | Moolre on `/donate`: Option A = full MoMo USSD API via Worker + webhook → Supabase transactions + receipts; Option B = payment-link redirect (launch first) | M |
| 5 | No domain | `klagon-org.pages.dev` | Add `klagon.org` zone to CF → attach custom domain + SSL; fix `metadataBase` + all hardcoded URLs | S |
| 6 | No transactional email/SMS | "approved within 24h" promise | Welcome/approval/rejection via Supabase auth email + **Moolre WhatsApp/SMS** for phone-first users; donation receipts | M |
| 7 | Dashboards are mock UIs | Static "Ama Kofi" | Member + admin dashboards backed by real auth + data (events, RSVPs, courses, progress, projects, member approval, event creation, attendance) | L |
| 8 | Chat bot is fake | Hardcoded FAQ matching | Honest "chat on WhatsApp" link, or real AI worker (CF Agents/Workers AI) with source answers | M |

### P1 — Before public launch

| # | Gap | Required work | Effort |
|---|---|---|---|
| 9 | Bot/spam protection | Cloudflare Turnstile on register/contact/donate/mentor/volunteer forms | S |
| 10 | Rate limiting + abuse | Supabase row limits, Turnstile scores, honeypot fields | S-M |
| 11 | SEO/OG | Per-page metadata, `og:image`, canonical, `sitemap.xml`, `robots.txt`, correct domain | S |
| 12 | Analytics + consent | Cloudflare Web Analytics (free); consent banner only if GA4 used | S |
| 13 | Legal pages | Privacy Policy, Terms of Use, child-data handling (minors), donation refund policy | S |
| 14 | Real contact info | Real email/phone/WhatsApp/social handles (placeholders today) | S |
| 15 | Error/observability | Client error monitoring (Sentry/CF Logs) + failure alerts | M |
| 16 | Tooling | Add eslint + config; `typecheck` gate; build CI | S |

### P2 — Strengthens test launch

| # | Gap | Required work | Effort |
|---|---|---|---|
| 17 | Events RSVP + capacity | Public event pages, RSVP, spot decrement, member + admin views | M |
| 18 | Learning tracks | Content via Supabase + Storage (PDFs), progress persistence | M |
| 19 | Volunteer/mentor applications | Persist + admin review queue (reuse registration pattern) | M |
| 20 | News/blog CMS | Admin-created articles (currently hardcoded) | M |
| 21 | Test automation | Vitest/Playwright for auth, RSVP, donation, approval paths | M |
| 22 | Deploy pipeline | GitHub → CF Pages auto-deploy on push (manual today) | S |
| 23 | Media/CDN | Real photos/files via Supabase Storage + signed URLs | S-M |
| 24 | A11y + CWV | Lighthouse pass, focus states, reduced motion, semantics | M |
| 25 | i18n | Defer (EN only); structure strings for later | 0 |

### P3 — Brand/quality fixes found in audit

- ChatBot badge shows "KY" (should be "KS") — `ChatBot.tsx:93`
- `metadataBase` domain wrong; hardcoded `© 2025` year in footer
- No favicon dark-mode variant / no `manifest.json`
- Login/register pages visually inconsistent with landing design
- `next.config.ts` export settings must be revisited once server features arrive

## Recommended Supabase schema (minimal viable)

```
profiles          (id→auth.users, full_name, phone, email, age, occupation, gender,
                   interests[], career_goal, role[member|admin|super_admin],
                   status[pending|approved|rejected], xp)
events, event_rsvps
courses, lessons, lesson_progress, badges, member_badges
projects, project_volunteers
news_articles
donations        (amount, tier, status, reference, moolre_meta)
sponsor_applications, mentor_applications, volunteer_signups, contact_messages
audit_logs       (admin actions)
```

All tables need RLS: public read for published rows, authenticated insert for approved
members, role-gated writes via `auth.jwt()`.

## Phased plan

1. **Phase 0 — Foundation:** Supabase schema + seed; `klagon.org` zone on CF; email service. (~1 week)
2. **Phase 1 — Auth & identity:** real auth, RBAC, registration → approval → onboarding; dashboards read real data. (~1.5 weeks)
3. **Phase 2 — Money & comms:** Moolre donations (start with payment links, upgrade to API+webhook), receipts, SMS/WhatsApp approvals. (~half week)
4. **Phase 3 — Hardening:** Turnstile, SEO/OG, legal, analytics, lint/CI, observability. (~half week)
5. **Phase 4 — Test launch:** staged rollout + smoke tests, then public.

## Info needed to start

1. Supabase project (or permission to create one) — confirm Supabase for auth + DB
2. Moolre keys: `X-API-USER`, public key, account number (sandbox first); cards needed or MoMo only?
3. Confirm `klagon.org` ownership so we add the zone to CF (or approve `gabochie.com` subdomain interim)
4. Real contact email, WhatsApp, and 1–2 live social handles

## Cost position

Zero recurring cost through test launch (Cloudflare Pages/Turnstile/Web Analytics free;
Supabase free tier; Cloudflare Email Routing free; Google Fonts free; domain ~$10–15/yr).
Only Moolre per-transaction fees apply once collections begin (rate per Moolre dashboard).
Free-tier caveats: Supabase free project pauses after 1 week inactivity; SMS via Moolre is
per-message (use WhatsApp/email by default).