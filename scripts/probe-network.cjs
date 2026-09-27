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

const supaHeaders = {
  apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
};

const HOSTS = [
  ["cloudflare (cdn)", "https://www.cloudflare.com/cdn-cgi/trace", {}],
  ["klagon.org (pages)", "https://klagon.org/", {}],
  ["supabase (rest)", `https://rvavixcgtninzccskfpy.supabase.co/rest/v1/courses?select=id&limit=1`, supaHeaders],
];

(async () => {
  console.log(`local: ${process.platform}, node ${process.version}\n`);
  for (const [name, url, headers] of HOSTS) {
    const t = [];
    let status = 0;
    for (let i = 0; i < 10; i += 1) {
      const t0 = performance.now();
      try {
        const r = await fetch(url, { headers });
        status = r.status;
        await r.arrayBuffer();
      } catch {
        status = "ERR";
      }
      t.push(performance.now() - t0);
    }
    t.sort((a, b) => a - b);
    const over1s = t.filter((x) => x > 1000).length;
    console.log(
      `${name.padEnd(20)} ${String(status).padEnd(4)} min=${t[0].toFixed(0).padEnd(5)} med=${t[5].toFixed(0).padEnd(5)} p90=${t[8].toFixed(0).padEnd(5)} max=${t[9].toFixed(0).padEnd(5)}  >1s: ${over1s}/10`
    );
  }
})();
