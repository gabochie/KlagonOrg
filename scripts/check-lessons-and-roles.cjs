const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const env = {};
for (const f of [".env.local", ".env"]) {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, f), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const base = env.NEXT_PUBLIC_SUPABASE_URL;
const H = {
  apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
};

const CHECKS = [
  ["lesson 'Your Phone is Your First Computer Lab'", "/rest/v1/lessons?select=id,title&title=ilike.*Your%20Phone&limit=5"],
  ["lesson count", "/rest/v1/lessons?select=id&limit=500"],
  ["volunteer roles (open)", "/rest/v1/volunteer_roles?select=id,title,status&limit=50"],
];

(async () => {
  for (const [label, p] of CHECKS) {
    const t0 = Date.now();
    try {
      const r = await fetch(base + p, { headers: H });
      const rows = await r.json();
      const ms = Date.now() - t0;
      if (!Array.isArray(rows)) {
        console.log(`${label}: HTTP ${r.status} in ${ms}ms ${JSON.stringify(rows).slice(0, 100)}`);
        continue;
      }
      console.log(`${label}: ${rows.length} row(s) in ${ms}ms`);
      for (const row of rows.slice(0, 12)) console.log(`   ${row.title ?? "(no title)"}`);
    } catch (e) {
      console.log(`${label}: FAILED after ${Date.now() - t0}ms ${e.message}`);
    }
  }
})();
