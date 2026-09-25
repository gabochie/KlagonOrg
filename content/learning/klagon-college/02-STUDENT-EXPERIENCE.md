# Klagon College — Student Experience & Interaction Specification

Status: **specification, not yet implemented**
Source: `Chat.txt`, `New Text Document.txt` (strategic review of the live `/learning/` experience)
Companion docs: `00-CURRICULUM-ARCHITECTURE.md` (what to teach), `01-CATALOGUE.md` (what exists)

---

## 1. The core problem this document solves

`/learning/klagon-college` currently renders the **catalogue layer only**: schools, programmes,
courses, syllabi, capstone, skills taxonomy. It is a read-only, statically exported brochure.

**No student can currently enrol, track progress, submit work, or accumulate evidence.**

A catalogue is not a college. The College becomes real at the moment a learner's capability
*accumulates and is provable*. That layer does not exist yet.

---

## 2. The institutional position

Klagon College is an **institution layer on top of the existing Learning Hub** — not a replacement
LMS. `/learning/` keeps its existing courses, URLs, lesson progress and XP; the College adds
structure, pathways and credentialing above them.

> Do not replace the Learning Hub. Extend it.
> Do not build "another Moodle." Build a digital college for applied capability.

### Information architecture (target)

```
KLAGON
├── COMMUNITY
├── DISCOVER
├── BUSINESS
├── PROJECTS
└── KLAGON COLLEGE
    ├── Schools        Art · Design · Technology · Entrepreneurship
    ├── Courses
    ├── Programs
    ├── Skills
    ├── Projects
    ├── Mentors
    ├── Skills Passport
    └── Opportunities
```

The existing six Learning Hub courses become the first foundation catalogue. Nothing is thrown away.

---

## 3. The core loop (this is the interaction requirement)

Every mature course must support the full loop:

```
LEARN → PRACTICE → BUILD → SUBMIT → DEMONSTRATE → EARN → SHOWCASE → CONNECT TO OPPORTUNITY
```

| Stage | Student action | Requires |
|---|---|---|
| Learn | Read/watch lessons | `lesson_progress` (exists) |
| Practice | Exercises, applied tasks | lesson content (exists) |
| Build | Produce an artefact | submission storage (**missing**) |
| Submit | Upload project + evidence | submissions table (**missing**) |
| Demonstrate | Evidence reviewed by mentor/admin | reviewer state (**missing**) |
| Earn | Badge / verified skill | verified_skills (**missing**) |
| Showcase | Public portfolio entry | portfolio (**missing**) |
| Connect | Matched to jobs/projects/community | opportunities link (**missing**) |

**Only the first two stages work today.**

The loop connects to the rest of the site:

```
Learning → Projects → Volunteer → Jobs & Opportunities → Community → Business
```

The College is the skills engine feeding the wider KLAGON ecosystem.

---

## 4. Credential hierarchy

Do not rush to imply accredited university degrees. Build this ladder instead:

```
Course → Skill → Badge → Certificate of Completion → College Pathway
       → College Portfolio → Applied Project → Skills Passport
```

A learner should not merely finish *"Automate 3 Tasks at Work with AI"*. They should be able to show:

> **AI Productivity — Demonstrated**
> course completed · lessons completed · exercise completed · practical project · evidence · badge · date · competencies · portfolio artefact

> Far more valuable than accumulating 27 meaningless certificates.

> **North star:** optimise for *how many people can we help become meaningfully more capable?* —
> not how many courses can we publish.

---

## 5. The Klagon Skills Passport

The College should not ask *"What certificates do you have?"*. It should answer
*"What can you actually do?"*

Each learner eventually gets a passport (private by default, optionally public) containing:

- Skills (durable, verified)
- Evidence and project artefacts
- Courses completed
- Badges
- Certifications
- Volunteer work
- Mentor endorsements
- Portfolio
- Community contributions
- Career interests
- Entrepreneurship activity

This becomes one of Klagon's most valuable long-term digital assets.

---

## 6. Learner dashboard

Extend the existing account experience — do not build a second identity system.

```
My Klagon College
  Learning progress        68%
  Current programme        Digital Entrepreneurship
  Skills demonstrated      12
  Badges                   7
  Courses completed        5
  Projects                 2
  Volunteer contributions  3
  Portfolio                View
  Skills Passport          View
  Opportunities            8
```

This creates a **learner identity**, not merely a login.

---

## 7. Programmes (certificate pathways)

Programmes are what make it feel like a college.

| Programme | Courses | Capstone |
|---|---|---|
| **Digital Entrepreneurship** | Communication · AI Productivity · Finance · Entrepreneurship · Career Readiness | Launch and document a real small business |
| **Community Digital Leadership** | Communication · Leadership · AI Productivity · Community Project · Entrepreneurship | Execute a measurable community project |
| **Creative Digital Practice** | Creativity Foundations · Visual Communication · Design Thinking · Digital Design · AI for Creatives · Portfolio Development | Produce a professional portfolio |

Each programme culminates in **portfolio-quality work**, not course completion.

---

## 8. Project-first rule

Every mature course must have an applied output:

| Domain | Project |
|---|---|
| Art | Create a documented visual story about your community |
| Design | Design a solution to a real local problem |
| Technology | Build an automation or digital tool |
| Entrepreneurship | Validate and launch a real business concept |
| Community Development | Execute a measurable community project |
| AI | Automate a real workflow |

**Projects become evidence in the learner's Skills Passport.** See `00-CURRICULUM-ARCHITECTURE.md` §PROJECT-FIRST CURRICULUM for the full rule set.

---

## 9. Reuse what already exists (do not rebuild)

| Existing asset | Path | Reuse for |
|---|---|---|
| Lesson reader UI | `src/components/learning/CourseViewer.tsx` | Learn / Practice stages |
| Sanitised markdown pipeline | `src/lib/sanitize.ts` | Syllabus + lesson rendering |
| Lesson completion | `supabase/migrations/20260912000000_initial_schema.sql` → `lesson_progress` | Progress tracking |
| Lesson XP trigger | `supabase/migrations/20260912002000_volunteer_role_and_lesson_xp.sql` | Earn (extend to course level) |
| Auth + RLS | `src/components/auth/AuthProvider.tsx`, `AuthProvider` | Identity for enrolment |
| Skill taxonomy | `content/learning/klagon-college/data/skills-taxonomy.json` | Verified-skill vocabulary |

---

## 10. Implementation gap (verified against the repo)

| Capability | State |
|---|---|
| Course catalogue + readers | **Built** |
| Skills taxonomy + validator | **Built** |
| Programmes + capstone definitions | **Built (as content)** |
| Enrolment / programme membership / cohorts | **Missing** |
| Prerequisites / lesson locking | **Missing** (`Lock` icon = unpublished, not prerequisite) |
| Persisted course completion | **Missing** (UI celebrates; no row written) |
| Submissions / projects / evidence upload | **Missing** (no storage bucket) |
| Reviewer / admin assessment states | **Missing** |
| Verified skills + badges from evidence | **Missing** |
| Certificates | **Missing** (dashboard shows a "Certified" label with no stored credential) |
| Skills Passport | **Missing** |
| College learner dashboard | **Missing** |

### Known inconsistencies to resolve when implementing

1. `LearningHubContent` hardcodes `lessonsDone: 0`, so the course grid always shows 0% complete.
2. `LearningProgress` labels 100% courses **"Certified"** but nothing is issued — inconsistent with
   the site's own "skills over certificates" positioning in `src/app/about/page.tsx`.
3. The College JSON catalogue is file-backed; the existing course model is Supabase-backed. One
   canonical source must be chosen before enrolment exists, or progress cannot be attributed.
4. `RequireAuth` checks that a user exists but not `profile.status` / approval.

---

## 11. Recommended build order

1. **Choose the canonical content source** — import the file-backed College catalogue into the
   existing Supabase `courses`/`lessons` model, or write an adapter onto the `CourseViewer` contract.
2. **Enrolment + programme membership** — tables, RLS, and a server-side completion function.
3. **Prerequisites + locking** — metadata, UI state and database enforcement.
4. **Persisted course completion** — close the gap where the UI celebrates but writes nothing.
5. **Submissions + evidence** — storage bucket, upload UI, reviewer/admin states.
6. **Verified skills + badges** — promote evidence to the durable-skill taxonomy.
7. **Skills Passport** — public/private learner capability record.
8. **College dashboard** — extend the existing account page, no second identity system.
9. **Authoring + tests** — content authoring path and learning/E2E coverage.

Quality over quantity. Do not generate hundreds of shallow courses to satisfy step 1.
