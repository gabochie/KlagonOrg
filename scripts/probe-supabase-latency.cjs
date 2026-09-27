const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
function loadEnv(file) {
  try {
    for (const line of fs.readFileSync(path.join(ROOT, file), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv(".env.local");
loadEnv(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const headers = { apikey: key, Authorization: `Bearer ${key}` };

const PROBES = [
  ["profiles_public", "/rest/v1/profiles_public?select=id&limit=1"],
  ["map_points_public", "/rest/v1/map_points_public?select=id&limit=1"],
  ["sponsors", "/rest/v1/sponsors?select=slug&limit=1"],
  ["business_cards", "/rest/v1/business_cards?select=slug&limit=1"],
  ["posts", "/rest/v1/posts?select=id&limit=1"],
  ["forum_threads", "/rest/v1/forum_threads?select=id&limit=1"],
  ["courses", "/rest/v1/courses?select=id&limit=1"],
];

function ms(t) {
  return `${t.toFixed(0)}ms`;
}

async function main() {
  console.log(`target: ${url}\n`);
  console.log("probe                          n   min     med     max");
  for (const [name, p] of PROBES) {
    const times = [];
    let status = 0;
    for (let i = 0; i < 5; i += 1) {
      const t0 = performance.now();
      try {
        const res = await fetch(`${url}${p}`, { headers });
        status = res.status;
        await res.arrayBuffer();
      } catch {
        status = -1;
      }
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const med = times[Math.floor(times.length / 2)];
    console.log(
      `${name.padEnd(28)}  ${status === 200 ? "200" : status}  ${ms(times[0]).padEnd(7)} ${ms(med).padEnd(7)} ${ms(times[times.length - 1])}`
    );
  }
}
main();
