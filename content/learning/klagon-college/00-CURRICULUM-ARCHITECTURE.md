# Klagon College — Curriculum Architecture

**Institution:** Klagon College of Art, Design, Technology & Entrepreneurship
**Portal route:** `/learning/` (preserve — do not rename)
**Principle:** Evolution, not replacement. Capability demonstrated > courses completed.
**Loop:** LEARN → PRACTICE → BUILD → SUBMIT → DEMONSTRATE → EARN → SHOWCASE → CONNECT

## 1. Critical reconciliation of source docs

Source files analysed: `Chat.txt`, `MASTER BUILD PROMPT.txt`,
`I would add this section...`, `New Text Document.txt`.

Strengths kept: preservation-first, 4 schools, Skills Passport, Ghana/Africa lens,
durable-vs-tool skills, project-first outputs.

Conflicts resolved:

| Conflict | Resolution |
|---|---|
| Levels: Foundation/Beginner/Intermediate/Advanced/Applied vs L0–L5 | Unified to **L0 Foundation, L1 Applied, L2 Professional, L3 Leadership**. Every course gets one level. |
| Credential chain of 8 steps (Course→Skill→Badge→Certificate→Pathway→Portfolio→Project→Passport) | Simplified to **Course → Skill Badge → Certificate → Program Completion → Skills Passport**. Portfolio/Project are *evidence*, not separate credential layers. |
| ~150 aspirational courses listed as if MVP | Split into **Live (6) / Phase-1 Build (7) / Coming Soon (placeholders)**. No fake catalogue. |
| Schools vs Foundations overlap (e.g. AI in Tech + Future Skills + Foundations) | Single-ownership rule: each course lives in **exactly one School OR Cross-College Core**. Cross-listed via skills, not duplicated. |
| Programs referencing non-existent courses | Phase-1 programs use **only Live + Phase-1 Build courses**. Everything else is draft. |
| No content governance | Added status + type + review fields (see §4). |

## 2. Structure

```
KLAGON.ORG
└── KLAGON COLLEGE (/learning/)
    ├── 4 Schools: Art, Design, Technology, Entrepreneurship
    ├── Cross-College Core (Foundations + Future of Work)
    ├── Courses (atomic unit)
    ├── Programs (course bundle + capstone → capability)
    ├── Skills (many-to-many taxonomy)
    └── Skills Passport (learner proof)
```

### Schools (own disciplines, own portfolio standard)

- **SOA Art:** creative expression, visual storytelling, music, writing. Output: documented artifact.
- **SOD Design:** objects/spaces/services/systems/experiences. Output: portfolio-quality solution.
- **SOT Technology:** digital + AI + data + automation as infrastructure. Output: working tool/automation.
- **SOE Entrepreneurship:** venture/value creation, not motivation. Output: validated venture or revenue event.

### Cross-College Core (CCC)

Everyone can access. Houses the 6 live courses + Future-of-Work bridge.
Domains: Human / Digital / Economic / Civic / Future capability.
Rule: if a course is foundational to all schools, it lives here, not in a school.

## 3. Course record (minimal, non-breaking)

Required: `id, title, school (SOA|SOD|SOT|SOE|CCC), domain, level (L0-L3),
status, type, duration_weeks, lessons, skills[], outcomes[], project, prerequisites[], relations`

- `status`: `live | pilot | coming_soon | archived`
- `type`: `core | elective | capstone | experimental`
- Admin adds fields only; never alters live course URLs/progress/XP.

## 4. Programs (capability bundles)

Program = required courses + 1 elective + capstone project + completion rule.
Phase-1: 4 programs max (see `data/programs.json`). No program ships with <80% of its courses live/pilot.

## 5. Skills (many-to-many)

Skills live in `data/skills-taxonomy.json` (~30 durable + tool skills).
Course→Skill is many-to-many. Passport aggregates verified skills + evidence.
No skill is awarded for passive completion — requires project/evidence or endorsement.

## 6. Phasing

- **Phase 0 (now):** taxonomy + metadata on 6 live courses. No schema break.
- **Phase 1:** 7 new L0/L1 courses (cheap to produce, mobile-first, no-laptop-friendly).
- **Phase 2:** programs + dashboard + passport MVP (`/learning/dashboard`, `/skills/[username]` private by default).
- **Phase 3+:** L2/L3, mentors endorsements, opportunity engine, verification `/verify/[id]`.

## 7. Governance

Every catalogue entry carries `review_date`. Cycle: Review → Skills Gap → New Course → Program Update → Recommendation.
North star: *How many people became meaningfully more capable?* — measured by projects + passport evidence, not course count.
