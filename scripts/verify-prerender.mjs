/**
 * Post-build gate: refuse to ship a static export containing dead course pages.
 *
 * klagon.org is `output: export`, so every dynamic page is rendered once at
 * build time and the result is frozen into HTML. If a Supabase read fails
 * during the build, the affected page still "succeeds" — it just bakes in
 * "This course is unavailable or unpublished." That is how 10/10 published
 * course pages once shipped broken behind a green build.
 *
 * Scope is deliberately narrow to avoid false alarms:
 *
 *   - Only ids shaped like a UUID are checked. The `COURSES` fallback in
 *     src/lib/constants.ts uses placeholder ids "1".."6", which exist purely
 *     to satisfy the non-empty generateStaticParams rule during a Supabase
 *     outage. Nothing links to them and they are always "unavailable" by
 *     design, so they are not a build failure.
 *   - Only the course page's own dead-state copy is matched. Empty-state text
 *     elsewhere in the app is legitimate and must not fail the build.
 *
 * Run via `npm run build`. Set ALLOW_EMPTY_PRERENDER=1 to bypass during a
 * deliberate offline/outage drill.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "out");

const DEAD_MARKER = "unavailable or unpublished";
const UUID_ROUTE = /(?:^|[\\/])(?:dashboard[\\/])?learning[\\/]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})[\\/]index\.html$/i;

function htmlFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "_next") continue;
      found.push(...htmlFiles(p));
    } else if (entry.name.endsWith(".html")) {
      found.push(p);
    }
  }
  return found;
}

if (!fs.existsSync(OUT)) {
  console.error("[verify-prerender] out/ not found — did `next build` run?");
  process.exit(1);
}

const files = htmlFiles(OUT);
const coursePages = files.filter((f) => UUID_ROUTE.test(f));
const offenders = coursePages.filter((f) =>
  fs.readFileSync(f, "utf8").includes(DEAD_MARKER)
);

console.log(
  `[verify-prerender] scanned ${files.length} page(s); ${coursePages.length} published course page(s) checked.`
);

if (coursePages.length === 0) {
  console.error(
    "[verify-prerender] No published course pages were generated at all.\n" +
      "  resolveStaticKeys() fell back to the COURSES placeholders, so the live\n" +
      "  course enumeration failed during the build and every real course page is\n" +
      "  missing from the export."
  );
  if (process.env.ALLOW_EMPTY_PRERENDER === "1") {
    console.warn("[verify-prerender] ALLOW_EMPTY_PRERENDER=1 — continuing anyway.");
    process.exit(0);
  }
  console.error("[verify-prerender] Refusing to ship. Re-run `npm run build`.");
  process.exit(1);
}

if (offenders.length === 0) {
  console.log("[verify-prerender] ok — every published course page has real content.");
  process.exit(0);
}

if (process.env.ALLOW_EMPTY_PRERENDER === "1") {
  console.warn(
    `[verify-prerender] ALLOW_EMPTY_PRERENDER=1 — ignoring ${offenders.length} dead course page(s).`
  );
  process.exit(0);
}

console.error(`[verify-prerender] ${offenders.length} published course page(s) shipped dead:`);
for (const f of offenders) console.error(`  ${path.relative(OUT, f)}`);
console.error(
  "\n[verify-prerender] Refusing to ship. This is almost always a transient\n" +
    "Supabase/network failure during the build, which is retried in\n" +
    "src/components/sections/CourseReaderContent.tsx. Re-run `npm run build`; if\n" +
    "it repeats, check NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY."
);
process.exit(1);
