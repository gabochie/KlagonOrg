# Klagon College — Curriculum Implementation

Implemented from the 4 source docs. Read in order:

1. `00-CURRICULUM-ARCHITECTURE.md` — structure, levels, governance.
2. `01-CATALOGUE.md` — human-readable phased catalogue.
3. `data/catalogue.json` — 13 specced courses + 9 coming_soon placeholders + capstone.
4. `data/skills-taxonomy.json` — durable vs tool skills, many-to-many rules.
5. `data/programs.json` — 4 programs (P1/P2/P4 shippable, P3 draft).

## Integrity checks

- 6 live courses preserved, single-ownership (no duplication).
- No program ships on fake courses (≥80% live/pilot rule).
- Statuses: `live | pilot | coming_soon | archived`; types: `core | elective | capstone | experimental`.
- JSON is the source of truth; markdown is the readable view. Validate with e.g. `python -m json.tool data/catalogue.json`.

## Next step for KLAGON.org codebase (not done here — no repo present)

Apply `school/domain/level/skills` tags to existing course records, add the 7 pilot
courses via existing admin, then build program + passport MVP on existing auth/progress/XP.
