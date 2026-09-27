#!/usr/bin/env node
/**
 * Refresh src/data/member-ids.json — the build-time fallback list used by the
 * /people/[id] static export when Supabase is unreachable.
 *
 * Static export enumerates member profile pages at build time, so this file is
 * what keeps `npm run build` from failing offline. Re-run it whenever members
 * are approved; the snapshot only matters for builds that cannot reach the
 * profiles_public view.
 *
 * Usage: node scripts/refresh-member-ids.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const OUT = path.join(__dirname, "..", "src", "data", "member-ids.json");

function loadEnv(file) {
  try {
    const text = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
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
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — cannot refresh."
    );
    process.exitCode = 1;
    return;
  }

  const res = await fetch(`${url}/rest/v1/profiles_public?select=id&limit=1000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.error(`Supabase responded ${res.status} ${res.statusText} — snapshot left unchanged.`);
    process.exitCode = 1;
    return;
  }

  const rows = await res.json();
  const ids = rows.map((r) => r.id).sort();
  if (ids.length === 0) {
    console.error("profiles_public returned no approved members — snapshot left unchanged.");
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(OUT, `${JSON.stringify(ids, null, 2)}\n`, "utf8");
  console.log(`Wrote ${ids.length} member id(s) to src/data/member-ids.json`);
}

main().catch((err) => {
  console.error(`Refresh failed: ${err.message} — snapshot left unchanged.`);
  process.exitCode = 1;
});
