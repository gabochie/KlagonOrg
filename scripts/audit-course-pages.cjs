const fs = require("node:fs");
const path = require("node:path");

const OUT = path.join(__dirname, "..", "out");

const walkCourseDirs = () => {
  const dir = path.join(OUT, "learning");
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "klagon-college")
    .map((d) => path.join(dir, d.name, "index.html"))
    .filter((p) => fs.existsSync(p));
};

const files = walkCourseDirs();
let bad = 0;
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  const broken = /unavailable or unpublished/i.test(html);
  if (broken) bad++;
  const id = path.basename(path.dirname(f)).slice(0, 8);
  console.log(`${broken ? "BROKEN" : "ok    "}  ${id}  ${(html.length / 1024).toFixed(1)}KB`);
}
console.log(`\n${bad}/${files.length} prerendered course pages are broken`);

const scope = process.argv[2];
if (scope) {
  console.log(`\nScanning other route groups for the same baked-in fallback: "${scope}"`);
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== "_next") walk(p);
      } else if (e.name.endsWith(".html")) {
        const html = fs.readFileSync(p, "utf8");
        if (html.includes(scope)) hits.push(path.relative(OUT, p));
      }
    }
  };
  walk(OUT);
  console.log(`${hits.length} page(s):`);
  for (const h of hits) console.log(`   ${h}`);
}
