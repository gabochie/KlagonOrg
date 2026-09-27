const fs = require("node:fs");
const path = require("node:path");

const OUT = path.join(__dirname, "..", "out");

const probe = (label, rel, needles) => {
  const file = path.join(OUT, rel);
  if (!fs.existsSync(file)) {
    console.log(`${label.padEnd(26)} MISSING ${rel}`);
    return;
  }
  const html = fs.readFileSync(file, "utf8");
  const verdict = needles.map((n) => `${n}=${html.includes(n) ? "yes" : "NO"}`).join("  ");
  console.log(`${label.padEnd(26)} ${(html.length / 1024).toFixed(1).padStart(6)}KB  ${verdict}`);
};

const firstOf = (dir) => {
  const d = path.join(OUT, dir);
  if (!fs.existsSync(d)) return null;
  const e = fs.readdirSync(d, { withFileTypes: true }).find((x) => x.isDirectory());
  return e ? path.join(dir, e.name, "index.html") : null;
};

const newsDir = firstOf("news");
const peopleDir = firstOf("people");
const bizDir = firstOf("b");

if (newsDir) probe("news/<id>", newsDir, ["<article", "KLAGON"]);
if (peopleDir) probe("people/<id>", peopleDir, ["profile", "KLAGON"]);
if (bizDir) probe("b/<slug>", bizDir, ["KLAGON"]);

probe("map", "map.html", ["KLAGON"]);
probe("business", "business.html", ["KLAGON"]);
probe("volunteer", "volunteer.html", ["KLAGON"]);

const emptyish = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== "_next") walk(p);
    } else if (e.name === "index.html") {
      const html = fs.readFileSync(p, "utf8");
      const rel = path.relative(OUT, p);
      if (rel.includes("klagon-college") || rel === "index.html") continue;
      if (html.includes("unavailable or unpublished")) emptyish.push(rel);
    }
  }
};
walk(OUT);
console.log(`\npages with the 'unavailable' fallback: ${emptyish.length}`);
