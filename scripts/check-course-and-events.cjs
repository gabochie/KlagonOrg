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
const H = {
  apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
};
const base = env.NEXT_PUBLIC_SUPABASE_URL;

const CHECKS = [
  ["course 'Your Phone...'", "/rest/v1/courses?select=id,title,published&title=ilike.*Your%20Phone"],
  ["all published courses", "/rest/v1/courses?select=id,title&published=eq.true&limit=100"],
  ["culture events", "/rest/v1/events?select=id,title&limit=50"],
];

(async () => {
  for (const [label, p] of CHECKS) {
    try {
      const r = await fetch(base + p, { headers: H });
      const rows = await r.json();
      if (!Array.isArray(rows)) {
        console.log(`${label}: HTTP ${r.status} ${JSON.stringify(rows).slice(0, 120)}`);
        continue;
      }
      console.log(`${label}: ${rows.length} row(s)`);
      for (const row of rows.slice(0, 12)) {
        console.log(`   ${String(row.id).slice(0, 8)}  ${row.title}`);
      }
    } catch (e) {
      console.log(`${label}: FAILED ${e.message}`);
    }
  }
})();
