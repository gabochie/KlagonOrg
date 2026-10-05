/**
 * Keeps the two E2E lanes honest.
 *
 * The suite is split by what a spec is allowed to do to the database:
 *
 *   read-only  no inserts, updates, deletes, RPCs or other writes. Safe to
 *              run on every pull request, including forks, so it is a
 *              required gate.
 *   mutating   creates posts, boost requests, directory claims and so on.
 *              Only runs on main and on manual dispatch, because every run
 *              is a real write against the real Supabase project.
 *
 * The split only protects production if it stays complete. A new spec that
 * nobody classifies would silently land in no lane and never run, so the
 * default is failure: every file must be in exactly one lane.
 *
 * The read-only lane gets a second check, on the substance rather than the
 * label. `WRITES` is deliberately broad â€” a single table DELETE in the
 * read-only lane would let a pull request create real rows, so it fails the
 * build rather than shipping.
 *
 * Run by `npm run build`. Add new specs to a lane explicitly.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const e2eDir = resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "e2e");

/**
 * The lane lists live in e2e/lanes.json, which playwright.config.ts also reads
 * so it can wire up the matching projects. One file, or the two could disagree
 * and the read-only lane could stop being a guarantee.
 */
const { readOnly: READ_ONLY, mutating: MUTATING } = JSON.parse(
  readFileSync(join(e2eDir, "lanes.json"), "utf8"),
);

/**
 * Anything that mutates. `rpc` is included because the staff RPCs are the
 * write path for claims now that table SELECT is revoked.
 */
const WRITES =
  /\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(|service_role|from\(\s*["'][a-z_]+["']\s*\)\s*\.\s*(insert|update|delete|upsert)/i;

const problems = [];
const fail = (msg) => problems.push(msg);

const onDisk = readdirSync(e2eDir)
  .filter((f) => f.endsWith(".spec.ts"))
  .sort();

const seen = new Map();
for (const [lane, list] of [
  ["read-only", READ_ONLY],
  ["mutating", MUTATING],
]) {
  for (const f of list) {
    if (seen.has(f)) fail(`${f} is listed in both the ${seen.get(f)} and ${lane} lanes.`);
    seen.set(f, lane);
  }
}

for (const f of onDisk) {
  if (!seen.has(f)) {
    fail(
      `${f} is in neither E2E lane, so it would never run. Add it to readOnly or mutating in e2e/lanes.json.`,
    );
  }
}

// Existence is checked before the scan so a renamed spec reports the rename
// rather than crashing the build on ENOENT, which would look like an unrelated
// Node failure in CI.
const listed = [...READ_ONLY, ...MUTATING];
const missing = listed.filter((f) => !onDisk.includes(f));
for (const f of missing) fail(`${f} is listed in a lane but does not exist in e2e/.`);

for (const f of READ_ONLY) {
  if (missing.includes(f)) continue;
  const src = readFileSync(join(e2eDir, f), "utf8");
  if (WRITES.test(src)) {
    fail(
      `${f} is in the read-only lane but contains a write. It runs on every pull request, so it must not touch the database.`,
    );
  }
}

if (problems.length > 0) {
  console.error("[verify-e2e-lanes] failed:");
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `[verify-e2e-lanes] ok — ${READ_ONLY.length} read-only spec(s) gated on pull requests, ` +
    `${MUTATING.length} mutating spec(s) limited to main.`,
);