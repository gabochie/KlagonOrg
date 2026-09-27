const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const env = {};
try {
  for (const line of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
} catch {}

const headers = {
  apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
};

(async () => {
  const res = await fetch(
    `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?select=id,title,status,created_at&status=eq.pending&order=created_at.desc&limit=100`,
    { headers }
  );
  if (!res.ok) {
    console.log(`query failed: ${res.status} ${res.statusText}`);
    return;
  }
  const rows = await res.json();
  console.log(`pending posts: ${rows.length}\n`);
  for (const r of rows) {
    console.log(`${String(r.status).padEnd(10)} ${String(r.id).slice(0, 8)}  ${r.title}`);
  }
})();
