import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Contract test for the Phase 1 IT content pipeline.
 * Guards the COMMITTED generator output (supabase/migrations/20260927000001*)
 * so future edits to the generator or content cannot silently ship a
 * short/quiz-less/broken course. Pure file assertions — no DB, no network.
 */

const SEED_PATH = path.resolve(
  process.cwd(),
  "supabase/migrations/20260927000001_it_tracks_0_1_seed.sql",
);

const EXPECTED_COURSES = [
  "Phone Ready - Start IT with Phone",
  "Build Your First Web Page",
  "Forms, Photos & Tables",
  "Publish Pro Site",
];

const EXPECTED_PREREQS: Array<[child: string, parent: string]> = [
  ["Build Your First Web Page", "Phone Ready - Start IT with Phone"],
  ["Forms, Photos & Tables", "Build Your First Web Page"],
  ["Publish Pro Site", "Forms, Photos & Tables"],
];

const EXPECTED_BADGES = new Set([
  "Digital Ready - Klagon",
  "HTML Starter",
  "HTML Order-Taker",
  "HTML Builder - Klagon",
]);

// SQL string literal body (handles '' escaping).
// SQL string-literal body fragment (non-capturing by design: use sites add
// their own capturing parens, so group indices stay stable).
const LIT = "(?:[^']|'')*";

function sql(): string {
  return readFileSync(SEED_PATH, "utf8").replace(/\r\n/g, "\n");
}

function unesc(s: string): string {
  return s.replace(/''/g, "'");
}

describe("IT Tracks 0+1 seed contract", () => {
  it("seeds exactly the 4 Phase 1 courses as published Future Skills courses", () => {
    const text = sql();
    const titles = [
      ...text.matchAll(
        new RegExp(`^select '(${LIT})', 'Future Skills', '[^']*', '(${LIT})', true$`, "gm"),
      ),
    ].map((m) => unesc(m[1]));
    expect(titles.sort()).toEqual([...EXPECTED_COURSES].sort());
  });

  it("chains prerequisites Track0 -> Basic -> Intermediate -> Advanced", () => {
    const text = sql();
    for (const [child, parent] of EXPECTED_PREREQS) {
      expect(text).toContain(`c.title = '${child}' and p.title = '${parent}'`);
    }
    // No other prerequisite links.
    const links = text.match(/^where c\.title = .* and p\.title = .*$/gm) ?? [];
    expect(links).toHaveLength(EXPECTED_PREREQS.length);
  });

  it("seeds 16 lessons with quiz-free bodies (no Answers leakage)", () => {
    const text = sql();
    const bodies = [...text.matchAll(/decode\('([A-Za-z0-9+/=]+)','base64'\)/g)].map((m) =>
      Buffer.from(m[1], "base64").toString("utf8"),
    );
    expect(bodies).toHaveLength(16);
    for (const body of bodies) {
      expect(body).not.toMatch(/^#### (Final Exam|Final Quiz|Quiz)\b/m);
      expect(body).not.toMatch(/^Answers:/m);
      expect(body).toMatch(/Summary/);
    }
  });

  it("seeds 16 quizzes: fifteen pass-3 plus one pass-4 final exam", () => {
    const text = sql();
    const quizzes = [
      ...text.matchAll(
        new RegExp(
          `^select l\\.id, (\\d+), (null|'(${LIT})')\\n` +
            `from public\\.lessons l join public\\.courses c on c\\.id = l\\.course_id\\n` +
            `where c\\.title = '(${LIT})' and l\\.sort_order = (\\d+)$`,
          "gm",
        ),
      ),
    ];
    expect(quizzes).toHaveLength(16);
    const scores = quizzes.map((m) => Number(m[1]));
    expect(scores.filter((s) => s === 3)).toHaveLength(15);
    expect(scores.filter((s) => s === 4)).toHaveLength(1);
    const badges = quizzes.filter((m) => m[2] !== "null").map((m) => unesc(m[3]));
    expect(new Set(badges)).toEqual(EXPECTED_BADGES);
    // Badges only on final lessons (sort_order 3).
    for (const m of quizzes) {
      if (m[2] !== "null") expect(Number(m[5])).toBe(3);
    }
  });

  it("seeds 65 well-formed questions: 3 options each, valid correct index", () => {
    const text = sql();
    const rows = [
      ...text.matchAll(
        new RegExp(`^select q\\.id, (\\d+), '(recall|fix-it)', '(${LIT})', '(${LIT})'::jsonb, ([0-2])$`, "gm"),
      ),
    ];
    expect(rows).toHaveLength(65);
    for (const m of rows) {
      const options = JSON.parse(unesc(m[4])) as unknown;
      expect(Array.isArray(options)).toBe(true);
      const strings = (options as unknown[]).filter(
        (o): o is string => typeof o === "string",
      );
      expect(strings).toHaveLength(3);
    }
  });
});
