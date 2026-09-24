# Klagon College — Proposed Catalogue (Phased)

> Quality > quantity. 6 live + 7 Phase-1 builds. Everything else is an explicit placeholder.

## A. Live courses (do not duplicate, add metadata only)

| ID | Title | Home | Level | Skills | Project |
|---|---|---|---|---|---|
| CCC-COM-01 | Deliver a Talk People Remember | CCC / Human | L0 | communication, storytelling, presentation | Deliver + record a 5-min talk |
| CCC-FIN-01 | Build Your First Savings Habit and Budget | CCC / Economic | L0 | financial-literacy, budgeting, cash-flow | 30-day savings log + budget |
| CCC-CAR-01 | Get Ready for Your First Job or Client | CCC / Economic | L0 | career-strategy, professional-identity, negotiation | CV + mock interview / first-client pitch |
| CCC-LEA-01 | Lead Your First Community Project | CCC / Civic | L1 | project-leadership, collaboration, community-development | Measurable micro-project + report |
| SOT-AI-01 | Automate 3 Tasks at Work with AI | SOT / AI | L1 | ai-literacy, prompting, workflow-automation | 3-task automation blueprint |
| SOE-VEN-01 | Launch a Real Side Business in 90 Days | SOE / Venture | L1 | opportunity-recognition, validation, pricing, sales | Validated offer + first sale attempt |

Mapping note: AI + Entrepreneurship courses move *logically* under SOT/SOE via `school` tag; URLs and progress records unchanged.

## B. Phase-1 build (7 courses — fill critical gaps)

| ID | Title | Home | Level | Weeks | Why now |
|---|---|---|---|---|---|
| SOT-DIG-01 | Digital Literacy: Start Without a Laptop | SOT / Digital Foundations | L0 | 3 | On-ramp for mobile-only learners; prerequisite for all Tech |
| CCC-AI-01 | AI Literacy: Working With AI | CCC / Digital | L0 | 3 | Durable human-AI collaboration, ethics, safety — precedes tool courses |
| SOD-DES-01 | Design Thinking: Solve a Local Problem | SOD / Foundations | L1 | 4 | Single gateway to all Design; produces portfolio piece |
| SOD-VIS-01 | Visual Communication for Beginners | SOD / Graphic | L1 | 4 | Typography, branding basics with free/mobile tools |
| SOA-PHO-01 | Mobile Photography & Visual Storytelling | SOA / Photography | L1 | 4 | Phone-only, feeds Art + community documentation |
| CCC-WOR-01 | Freelancing & Remote Work Foundations | CCC / Future | L1 | 3 | Monetisation bridge: job/client → income |
| CAP-001 | Community / Venture Capstone Studio | Cross-school capstone | L1 | 4 | Shared capstone reviewer + passport evidence pipeline for P1/P2 |

Each Phase-1 course spec (outcomes, skills, project, prerequisites, duration, type) is in `data/catalogue.json`.

## C. Programs (ship only when ≥80% constituent courses are live/pilot)

1. **P1 Digital Entrepreneurship** — CCC-COM-01, CCC-FIN-01, SOT-AI-01, SOE-VEN-01, CCC-WOR-01 + CAP-001. Outcome: documented micro-business.
2. **P2 Community Digital Leadership** — CCC-COM-01, CCC-LEA-01, CCC-AI-01, SOT-DIG-01 + CAP-001. Outcome: measurable community project.
3. **P3 Creative Digital Practice** — SOD-DES-01, SOD-VIS-01, SOA-PHO-01 + portfolio review. Outcome: professional portfolio. (Draft until B ships.)
4. **P4 AI-Augmented Work** — SOT-DIG-01, CCC-AI-01, SOT-AI-01 + automation blueprint. Outcome: 3 live automations.

## D. Coming Soon (placeholders — one per gap, no fake detail)

SOA: Music Production, AI-Assisted Writing · SOD: UX Foundations, Spatial Thinking ·
SOT: Web Foundations, Data with Spreadsheets, Cybersecurity Awareness ·
SOE: Venture Finance & Cash Flow, E-Commerce Starter. All `status: coming_soon`.

## E. What was cut / deferred

Deferred to Phase 3+: BIM, robotics, blockchain, XR, advanced venture scaling — fashionable without local use-case + reviewer capacity. Criterion for revival: named Ghanaian use-case + mentor available.
