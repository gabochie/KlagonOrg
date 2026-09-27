#!/usr/bin/env node
/**
 * Refresh the build-time route snapshots under src/data/.
 *
 * Why this exists: klagon.org is a static export (`output: export`), so Next
 * enumerates every dynamic route at build time via generateStaticParams. If a
 * Supabase-backed route can't reach the database and returns an empty array,
 * the ENTIRE build fails with a confusing "missing generateStaticParams()"
 * error. The routes therefore fall back to these committed snapshots when the
 * live query fails — same pattern as learning/[id] falling back to COURSES.
 *
 * Snapshots are only a fallback for builds that cannot reach Supabase. Normal
 * builds use live data, so new sponsors/news appear without refreshing.
 *
 * Usage: node scripts/refresh-static-snapshots.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const DATA_DIR = path.join(ROOT, "src", "data");

const TARGETS = [
  { file: "member-ids.json", table: "profiles_public", columns: "id", label: "member ids" },
  { file: "sponsor-slugs.json", table: "sponsors", columns: "slug", label: "active sponsor slugs" },
  { file: "business-card-slugs.json", table: "business_cards", columns: "slug", label: "business card slugs" },
  { file: "news-ids.json", table: "posts", columns: "id", label: "approved news ids" },
];

function loadEnv(file) {
  try {
    const text = fs.readFileSync(path.join(ROOT, file), "utf8");
    for (const line of text.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!m) continue;
      let value = m[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  } catch {
    /* optional file */
  }
}

loadEnv(".env.local");
loadEnv(".env");

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — nothing refreshed.");
    process.exitCode = 1;
    return;
  }

  let failed = false;

  for (const target of TARGETS) {
    let query = `${url}/rest/v1/${target.table}?select=${target.columns}&limit=1000`;
    if (target.table === "sponsors") query += "&status=eq.active";
    if (target.table === "posts") query += "&status=eq.approved";

    try {
      const res = await fetch(query, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        console.error(`  ✗ ${target.label}: HTTP ${res.status} ${res.statusText} — left unchanged`);
        failed = true;
        continue;
      }
      const rows = await res.json();
      const values = rows.map((r) => r[target.columns]).filter(Boolean).sort();
      if (values.length === 0) {
        console.error(`  ✗ ${target.label}: query returned nothing — left unchanged`);
        failed = true;
        continue;
      }
      fs.writeFileSync(
        path.join(DATA_DIR, target.file),
        `${JSON.stringify(values, null, 2)}\n`,
        "utf8"
      );
      console.log(`  ✓ ${target.file} — ${values.length} ${target.label}`);
    } catch (err) {
      console.error(`  ✗ ${target.label}: ${err.message} — left unchanged`);
      failed = true;
    }
  }

  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`Refresh failed: ${err.message} — snapshots left unchanged.`);
  process.exitCode = 1;
});
