#!/usr/bin/env node
/**
 * Verifies the KDA course export against the live site and the seed data.
 *
 * This is the authoring-side counterpart to verify-course-covers.mjs, which
 * asserts that *published* courses show authored art. This script asserts that
 * the exported folder tree is internally consistent and that lesson counts match
 * what klagon.org actually serves. Neither script would catch the other's
 * failure mode:
 *
 *   1. A lesson edited locally but never deployed. verify-course-covers only
 *      looks at covers, so it passes while the export drifts from production.
 *
 *   2. An in-design course silently going live. Courses 11-12 are scaffolded but
 *      unpublished, and this script is what stops one from quietly acquiring
 *      lessons or a live URL before its presell clears.
 *
 * Not part of `npm run build`. It hits the live site with a real browser and
 * reads the authoring export, which lives outside the repo, so it is run by hand
 * when the export changes.
 *
 *   node scripts/verify-kda-export.mjs
 *   node scripts/verify-kda-export.mjs --no-live     # skip the browser pass
 *
 * Env:
 *   KDA_DIR         authoring export root (default ../Klagon College/KDA,
 *                   resolved relative to this script)
 *   SEED_JSON       path to migrated-courses.json (default <KDA_DIR>/../.cache/
 *                   migrated-courses.json, falling back to $TEMP/opencode)
 *   EXPECT_FOLDERS  expected folder count (default 12)
 *   EXPECT_LESSONS  expected lesson total across live courses (default 48)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = !process.argv.includes("--no-live");

// Courses 11-12 are in design: folder + course.md + cover, no lessons, not live.
// Held to presence checks only, never to lesson counts or a live cross-check.
const IN_DESIGN = [
  "11 - Build a Product People Buy and Launch It",
  "12 - KLAGONISM - The Integrated Art of Love, Creativity, Wisdom, Purity and Integrity",
];
const COVER_SUFFIXES = ["-1920.jpg", "-1200.webp", "-600.webp", "-og.jpg"];

const EXPECT_FOLDERS = Number(process.env.EXPECT_FOLDERS ?? 12);
const EXPECT_LESSONS = Number(process.env.EXPECT_LESSONS ?? 48);
const EXPECT_MD = EXPECT_FOLDERS + EXPECT_LESSONS + 1; // + this export's README

const KDA = process.env.KDA_DIR
  ? path.resolve(process.env.KDA_DIR)
  : path.resolve(root, "..", "Klagon College", "KDA");

const isPlanned = (d) => IN_DESIGN.includes(d);

let fail = 0;
const bad = (m) => {
  console.log("  FAIL " + m);
  fail++;
};
const ok = (m) => console.log("  ok   " + m);

function resolveSeed() {
  const candidates = [
    process.env.SEED_JSON,
    path.join(KDA, "..", ".cache", "migrated-courses.json"),
    path.join(process.env.TEMP ?? "", "opencode", "migrated-courses.json"),
  ].filter(Boolean);
  for (const c of candidates) if (fs.existsSync(c)) return c;
  return null;
}

(async () => {
  if (!fs.existsSync(KDA)) {
    console.error(`KDA export not found: ${KDA}`);
    console.error("Set KDA_DIR to the authoring export root.");
    process.exit(2);
  }

  const seedPath = resolveSeed();
  let byTitle = new Map();
  if (seedPath) {
    const data = JSON.parse(fs.readFileSync(seedPath, "utf8"));
    byTitle = new Map(data.map((c) => [c.title, c]));
  }

  const dirs = fs
    .readdirSync(KDA)
    .filter((d) => fs.statSync(path.join(KDA, d)).isDirectory());
  const planned = dirs.filter(isPlanned);
  const live = dirs.filter((d) => !isPlanned(d));

  console.log("=== structure ===");
  ok(`${dirs.length} course folders (${live.length} live + ${planned.length} in design)`);
  if (dirs.length !== EXPECT_FOLDERS) bad(`expected ${EXPECT_FOLDERS} folders, got ${dirs.length}`);
  for (const p of IN_DESIGN) if (!dirs.includes(p)) bad(`missing in-design folder: ${p}`);
  if (!fs.existsSync(path.join(KDA, "README.md"))) bad("README.md missing");
  else ok("README.md present");
  if (!seedPath) console.log("  warn no seed JSON found - lesson counts cannot be cross-checked");

  let lessonTotal = 0;
  const local = {};
  const liveUrls = [];

  for (const d of dirs) {
    const full = path.join(KDA, d);
    const md = fs.readdirSync(full).filter((f) => f.toLowerCase().endsWith(".md"));
    const courseMd = md.filter((f) => f === "course.md");
    const lessons = md.filter((f) => f !== "course.md");
    const raw = fs.readFileSync(path.join(full, "course.md"), "utf8");
    const title = raw.split("\n")[0].replace(/^#\s+/, "").trim();

    if (isPlanned(d)) {
      if (courseMd.length !== 1) {
        bad(`${d}: expected 1 course.md, got ${courseMd.length}`);
        continue;
      }
      if (lessons.length !== 0)
        bad(`${d}: in-design course has ${lessons.length} lesson files, expected 0`);
      if (/https:\/\/klagon\.org\/learning\/[0-9a-f-]+\//.test(raw))
        bad(`${d}: in-design course carries a live URL - it is not published`);

      const coverDir = path.join(full, "cover");
      const cover = fs.existsSync(coverDir)
        ? fs.readdirSync(coverDir).filter((f) => /\.(jpe?g|webp|png)$/i.test(f))
        : [];
      for (const s of COVER_SUFFIXES)
        if (!cover.some((f) => f.endsWith(s))) bad(`${d}/cover: missing ${s}`);
      if (cover.length !== COVER_SUFFIXES.length)
        bad(`${d}/cover: expected ${COVER_SUFFIXES.length} files, got ${cover.length}`);
      ok(`${d.padEnd(46)} in design  cover ${cover.length}/4  no lessons`);
      continue;
    }

    lessonTotal += lessons.length;
    if (courseMd.length !== 1) bad(`${d}: expected 1 course.md, got ${courseMd.length}`);
    local[title] = lessons.length;

    // Lesson numbering must be contiguous 01..N.
    const nums = lessons.map((f) => parseInt(f.slice(0, 2), 10)).sort((a, b) => a - b);
    const want = lessons.map((_, i) => i + 1);
    if (JSON.stringify(nums) !== JSON.stringify(want))
      bad(`${d}: lesson numbering ${nums} != ${want}`);

    for (const f of lessons) {
      const p = path.join(full, f);
      const bytes = fs.readFileSync(p);
      const t = bytes.toString("utf8");
      if (!Buffer.from(t, "utf8").equals(bytes)) bad(`${d}/${f}: not valid UTF-8`);
      if (t.includes("\uFFFD")) bad(`${d}/${f}: replacement char`);
      if (!t.startsWith("# Lesson ")) bad(`${d}/${f}: missing '# Lesson' H1`);
      if (t.trim().split(/\s+/).filter(Boolean).length < 300) bad(`${d}/${f}: under 300 words`);
      if (/HOW TO UPLOAD TO KLAGON/i.test(t)) bad(`${d}/${f}: admin note leaked`);
    }

    const mig = byTitle.get(title);
    const expect = mig ? mig.lessons.length : null;
    const tag = expect === null ? "recovered (no seed)" : `seed=${expect}`;
    if (expect !== null && expect !== lessons.length)
      bad(`${d}: ${lessons.length} lessons != seed ${expect}`);
    else ok(`${d.padEnd(46)} ${String(lessons.length).padStart(2)} lessons  ${tag}`);

    const url = (raw.match(/https:\/\/klagon\.org\/learning\/[0-9a-f-]+\//) || [])[0];
    if (url) liveUrls.push({ d, title, url });
    else bad(`${d}: no live URL in course.md`);
  }

  console.log(`\n=== totals ===`);
  ok(`lesson files: ${lessonTotal} (expected ${EXPECT_LESSONS} across ${live.length} live courses)`);
  if (lessonTotal !== EXPECT_LESSONS) bad(`lesson total ${lessonTotal} != ${EXPECT_LESSONS}`);
  const allMd = fs
    .readdirSync(KDA, { recursive: true })
    .filter((f) => f.toLowerCase().endsWith(".md"));
  ok(`all markdown: ${allMd.length} (= ${EXPECT_FOLDERS} course.md + ${EXPECT_LESSONS} lessons + 1 README)`);
  if (allMd.length !== EXPECT_MD) bad(`markdown total ${allMd.length} != ${EXPECT_MD}`);

  if (!LIVE) {
    console.log("\n  skip live cross-check (--no-live)");
  } else if (liveUrls.length !== live.length) {
    bad(`only ${liveUrls.length}/${live.length} live courses have a URL to check`);
  } else {
    console.log(`\n=== live cross-check (${liveUrls.length} live courses) ===`);
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    let liveTotal = 0;
    for (const { title, url } of liveUrls) {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(1200);
      const served = await page.evaluate(
        () => [...document.querySelectorAll("button")].filter((x) => /^\d+\.\s/.test(x.innerText.trim())).length
      );
      liveTotal += served;
      const localCount = local[title];
      if (served !== localCount) bad(`${title}: live has ${served} lessons, folder has ${localCount}`);
      else ok(`${title.padEnd(44)} live=${served} local=${localCount}`);
    }
    await browser.close();
    ok(`live lesson total: ${liveTotal}`);
  }

  console.log(`\n=== result ===`);
  if (fail === 0)
    console.log(
      `ALL CHECKS PASSED  (${live.length} live courses, ${lessonTotal} lessons` +
        (LIVE ? `, live total ${lessonTotal}` : "") +
        `; ${planned.length} in design)`
    );
  else console.log(`${fail} FAILURE(S)`);
  process.exit(fail === 0 ? 0 : 1);
})();