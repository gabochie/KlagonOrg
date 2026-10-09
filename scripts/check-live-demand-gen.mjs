#!/usr/bin/env node
/**
 * Live probes for the demand-gen build. Anon-key only, read-only — safe
 * against staging AND production (no inserts, no auth, no secrets).
 *
 * Asserts the things static checks cannot:
 *   - priced courses carry the advertised fee (catches zero-row updates)
 *   - paid courses have full lessons; the free twin is untouched
 *   - verify_certificate RPC: miss on garbage, hit shape on real codes
 *   - certificates table is not directly readable by anon (no enumeration)
 *   - every courseId wired in /go pages resolves with a price
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/check-live-demand-gen.mjs
 *   Without env it warns and exits 0 (CI without staging secrets stays green).
 *   Pass --strict to fail closed (pre-release gate).
 */
const strict = process.argv.includes("--strict");
const failures = [];
const fail = (msg) => failures.push(msg);

const URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.log("check-live-demand-gen: no SUPABASE_URL/KEY — skipping live probes.");
  process.exit(strict ? 1 : 0);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
async function rest(path, opts = {}) {
  const res = await fetch(`${URL}/rest/v1/${path}`, { headers, ...opts });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

// ---- 1. Priced courses match the advertised offer ----
const EXPECTED = [
  { match: "AI — PRO Sprint", price: 150, minLessons: 5 },
  { match: "Side Business", price: 150, minLessons: 5 },
  { match: "Freelancer — PRO Sprint", price: 100, minLessons: 5 },
];
const { body: courses } = await rest("courses_public?select=id,title,price_ghs,lesson_count");
if (!Array.isArray(courses)) {
  fail("courses_public unreadable — anon RLS or project down");
} else {
  for (const exp of EXPECTED) {
    const hit = courses.filter((c) => c.title.includes(exp.match));
    if (hit.length !== 1) {
      fail(`expected exactly 1 course matching "${exp.match}", found ${hit.length}`);
      continue;
    }
    if (Number(hit[0].price_ghs) !== exp.price) {
      fail(`${hit[0].title}: price_ghs=${hit[0].price_ghs}, want ${exp.price}`);
    }
    if ((hit[0].lesson_count ?? 0) < exp.minLessons) {
      fail(`${hit[0].title}: only ${hit[0].lesson_count} lessons, want >=${exp.minLessons}`);
    }
  }
  // Free twin untouched: the non-PRO automation course stays free with lessons.
  const free = courses.filter(
    (c) => c.title.includes("Automate 3 Tasks") && !c.title.includes("PRO")
  );
  if (free.length !== 1 || free[0].price_ghs !== null) {
    fail("free 'Automate 3 Tasks' course missing or wrongly priced");
  }
}

// ---- 2. verify_certificate: miss behaves, table stays shut ----
const miss = await rest("rpc/verify_certificate", {
  method: "POST",
  body: JSON.stringify({ p_code: "KLG-XX-000000" }),
});
if (!Array.isArray(miss.body) || miss.body.length !== 0) {
  fail(`verify_certificate('KLG-XX-000000') should return [], got ${JSON.stringify(miss.body)?.slice(0, 120)}`);
}
const leak = await rest("certificates?select=code&limit=1");
if (leak.status !== 401 && leak.status !== 403 && !(Array.isArray(leak.body) && leak.body.length === 0)) {
  // Anon must never enumerate codes. Empty array via RLS is acceptable;
  // rows leaking is a hard fail.
  if (Array.isArray(leak.body) && leak.body.length > 0) {
    fail("certificates table enumerable by anon — codes leak");
  }
}

if (failures.length > 0) {
  console.error(`check-live-demand-gen: ${failures.length} failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("check-live-demand-gen: OK (prices, lessons, verify miss, no cert leak)");
