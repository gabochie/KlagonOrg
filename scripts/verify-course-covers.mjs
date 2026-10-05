#!/usr/bin/env node
/**
 * Asserts every published course actually shows its authored cover.
 *
 * Two failure modes this catches, neither of which lint/typecheck/e2e would:
 *
 *   1. A migration title that does not match the database exactly. The cover
 *      seed matches on `title` because `courses` has no stable token column, so
 *      a typo silently updates zero rows. `verify-course-covers` is what turns
 *      that from "the page quietly shows a generic gradient" into a red build.
 *
 *   2. A `cover_url` or `cover` pointing at a token with no committed
 *      derivatives, which renders as a broken image rather than a fallback.
 *
 * The template fallback itself is NOT a failure. Pilot college courses with no
 * authored art are meant to show a branded template, so only the ten published
 * courses are asserted.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const outDir = path.join(root, "out");

/** Tokens with authored art in covers-src, as committed. */
const AUTHORED = [
  "SOT-AI-01",
  "CCC-FIN-01",
  "CCC-LEA-01",
  "SOE-VEN-01",
  "CCC-COM-01",
  "CCC-CAR-01",
  "SOT-IT-01",
  "SOT-IT-02",
  "SOT-IT-03",
  "SOT-IT-04",
];

const DERIVATIVES = ["-600.webp", "-1200.webp", "-og.jpg"];
const failures = [];

// 1. Every authored token has all three derivatives committed.
for (const token of AUTHORED) {
  for (const suffix of DERIVATIVES) {
    const file = path.join(publicDir, "brand", "learning", token + suffix);
    if (!fs.existsSync(file)) {
      failures.push(`missing derivative public/brand/learning/${token}${suffix}`);
    } else if (fs.statSync(file).size < 1024) {
      failures.push(`suspiciously small derivative ${token}${suffix}`);
    }
  }
}

// 2. No authored course page still resolves to a template cover.
const catalogue = JSON.parse(
  fs.readFileSync(
    path.join(root, "content", "learning", "klagon-college", "data", "catalogue.json"),
    "utf8",
  ),
);
const sharedTokens = new Set(AUTHORED);
for (const course of catalogue.courses ?? []) {
  if (course.status !== "live") continue;
  if (!sharedTokens.has(course.id)) {
    failures.push(`live college course ${course.id} has no authored cover`);
    continue;
  }
  if (course.cover !== `/brand/learning/${course.id}`) {
    failures.push(
      `live college course ${course.id} cover should be /brand/learning/${course.id}, got ${course.cover ?? "null"}`,
    );
  }
}

if (failures.length) {
  console.error(`[verify-course-covers] ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}

// 3. The export itself must not show a template on a page that has authored art.
//    This is the only check that sees the database, so it is the one that turns a
//    mistyped migration title into a failed build instead of a generic gradient.
if (!fs.existsSync(outDir)) {
  console.error("[verify-course-covers] out/ not found. Run the build first.");
  process.exit(1);
}

const ids = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "course-ids.json"), "utf8"));
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let checkedPages = 0;
const readIfPresent = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null);

// Published course pages exist twice: /learning/<id> and /dashboard/learning/<id>.
for (const id of ids) {
  if (!UUID_RE.test(id)) continue;
  for (const rel of [path.join("learning", id), path.join("dashboard", "learning", id)]) {
    const html = readIfPresent(path.join(outDir, rel, "index.html"));
    if (html === null) continue;
    checkedPages++;
    if (html.includes("/brand/learning/templates/")) {
      failures.push(`exported ${rel.replace(/\\/g, "/")} still renders a template cover`);
    }
  }
}

// Live college pages have authored art; pilot pages legitimately keep templates.
for (const course of catalogue.courses ?? []) {
  if (course.status !== "live") continue;
  const html = readIfPresent(path.join(outDir, "learning", "klagon-college", course.id, "index.html"));
  if (html === null) continue;
  checkedPages++;
  if (html.includes("/brand/learning/templates/")) {
    failures.push(`exported live college page ${course.id} still renders a template cover`);
  }
}

if (failures.length) {
  console.error(`[verify-course-covers] ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    "[verify-course-covers] If a published course shows a template, the cover seed migration probably did not match its title.",
  );
  process.exit(1);
}

console.log(
  `[verify-course-covers] OK — ${AUTHORED.length} authored covers, ${AUTHORED.length * DERIVATIVES.length} derivatives, ${checkedPages} exported course pages on real covers`,
);