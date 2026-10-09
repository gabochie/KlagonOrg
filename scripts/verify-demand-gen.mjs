#!/usr/bin/env node
/**
 * Guards the demand-gen build: sales pages, checkout telemetry, verify flow.
 *
 * Static checks (no DB needed, runs in `npm run build`):
 *
 *   1. Migration hygiene — a lesson upsert matched by ILIKE title MUST also pin
 *      price_ghs/published. Bare title matching once targeted zero rows live
 *      (silent no-op pricing) and could clobber a free course's lessons.
 *   2. SalesCta sources — every `source="..."` used in src/app/go must exist in
 *      WA_MESSAGES, or the WhatsApp message falls back to the wrong offer.
 *   3. Paid CTAs — every SalesCta with `price=` must carry a UUID-shaped
 *      `courseId=`, or Enrol dead-ends at register instead of MoMo checkout.
 *   4. Poll timeout — CourseCheckout must emit a `timeout` event + error when
 *      MoMo polling gives up, or the funnel goes blind and the user confused.
 *   5. RPC names — VerifyContent/forms RPC strings must match a
 *      `create ... function public.<name>` in supabase/migrations, since the
 *      clients call through untyped casts that hide drift.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
const fail = (msg) => failures.push(msg);

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function walk(dir, exts, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, exts, out);
    } else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

// ---- 1. Migration hygiene ----
const migDir = path.join(root, "supabase", "migrations");
const migrations = fs
  .readdirSync(migDir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => ({ file: f, sql: fs.readFileSync(path.join(migDir, f), "utf8") }));

for (const { file, sql } of migrations) {
  // Find lesson upserts matched by ILIKE title; each must pin price/published.
  const stmts = sql.split(/;\s*\n/);
  for (const stmt of stmts) {
    if (/insert\s+into\s+public\.lessons/i.test(stmt) && /c\.title\s+ilike/i.test(stmt)) {
      if (!/price_ghs|published/i.test(stmt)) {
        fail(`${file}: lesson upsert matched by ILIKE title without a price_ghs/published pin`);
      }
    }
  }
}

// ---- 2 + 3. SalesCta sources and paid CTAs ----
const salesCta = read("src/components/go/SalesCta.tsx");
const waKeys = new Set(
  [...salesCta.matchAll(/"([a-z0-9-]+)":\s*\n?\s*"Hello KLAGON/g)].map((m) => m[1])
);
const goPages = walk(path.join(root, "src", "app", "go"), [".tsx"]).filter((f) =>
  f.endsWith("page.tsx")
);
const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
for (const page of goPages) {
  const src = fs.readFileSync(page, "utf8");
  const rel = path.relative(root, page);
  for (const m of src.matchAll(/source="([^"]+)"/g)) {
    if (!waKeys.has(m[1])) fail(`${rel}: SalesCta source="${m[1]}" missing from WA_MESSAGES`);
  }
  for (const m of src.matchAll(/<SalesCta([\s\S]*?)\/>/g)) {
    const props = m[1];
    const srcMatch = props.match(/source="([^"]+)"/);
    // Concierge offers (B2B team, hiring) sell over WhatsApp — no course row.
    const concierge = srcMatch && ["ai-sprint-team", "go-hire"].includes(srcMatch[1]);
    if (/price=\{/.test(props) && !concierge && !/courseId="([^"]+)"/.test(props)) {
      fail(`${rel}: paid SalesCta (price=) without courseId= dead-ends at register`);
    }
    const id = props.match(/courseId="([^"]+)"/);
    if (id && !uuidRe.test(id[1])) fail(`${rel}: courseId="${id[1]}" is not UUID-shaped`);
  }
}

// ---- 4. Poll timeout telemetry ----
const checkout = read("src/components/learning/CourseCheckout.tsx");
if (!checkout.includes('action: "timeout"')) {
  fail("CourseCheckout.tsx: poll give-up path must recordLeadEvent timeout + show an error");
}

// ---- 5. RPC names exist in migrations ----
const allSql = migrations.map((m) => m.sql).join("\n");
for (const fn of ["verify_certificate", "log_agent_lead"]) {
  const re = new RegExp(`function\\s+public\\.${fn}\\s*\\(`, "i");
  if (!re.test(allSql)) fail(`migrations: no public.${fn}() for the untyped client call`);
}
// VerifyContent passes { p_code }; forms passes the six log_agent_lead args.
const verify = read("src/components/verify/VerifyContent.tsx");
if (verify.includes("verify_certificate") && !/p_code/.test(allSql)) {
  fail("migrations: verify_certificate signature must accept p_code");
}

if (failures.length > 0) {
  console.error(`verify-demand-gen: ${failures.length} failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("verify-demand-gen: OK (sources, courseIds, timeout telemetry, RPC names, migration pins)");
