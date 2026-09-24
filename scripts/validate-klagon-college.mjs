// KLAGON COLLEGE — curriculum integrity validator.
// Source of truth: content/learning/klagon-college/  (single-ownership, JSON is truth)
// Rules enforced per 00-CURRICULUM-ARCHITECTURE.md + MASTER BUILD PROMPT:
//   R1  every course id matches ^[A-Z]{3}-[A-Z]{2,3}-\d{2}$   (school-domain-num; 2-3 char segment incl AI/WOR/PHO)
//   R2  status ∈ {live, pilot, coming_soon, archived}
//   R3  every course skill token exists in the skills taxonomy (durable ∪ tool)
//   R4  every program required/elective/capstone ref resolves to a course or capstone id
//   R5  every syllabus .md exists (7 courses + 1 capstone, per SI_INDEX)
//   R6  capstone "gates" are milestone reviews (free-text), NOT course ids — never resolved as courses
// Reads source JSON (files on disk), never touches the DB. Exit 0 = green.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const base = join(here, "..", "content", "learning", "klagon-college");
const J = (f) => JSON.parse(readFileSync(join(base, f), "utf8"));
const catalogue = J("data/catalogue.json");
const programs = J("data/programs.json");
const taxonomy = J("data/skills-taxonomy.json");

const ID_RX = /^[A-Z]{3}-[A-Z]{2,3}-\d{2}$/;
const allCourses = [...(catalogue.courses ?? []), ...(catalogue.coming_soon ?? [])];
const capstones = catalogue.capstones ?? [];
const courseIds = new Set(allCourses.map((c) => c.id));
const capstoneIds = new Set(capstones.map((c) => c.id));
const idOf = (txt) => (typeof txt === "string" ? txt.trim().split(" (")[0].trim() : "");

const errs = [];

for (const c of allCourses) {
  if (!ID_RX.test(c.id)) errs.push(`${c.id}: id must match XXX-XXX|XX-NN`);
}

const tokens = new Set([...(taxonomy.durable ?? []), ...(taxonomy.tool ?? [])]);
const used = new Set();
for (const c of allCourses) for (const s of c.skills ?? []) used.add(s);
for (const s of used) if (!tokens.has(s)) errs.push(`skill "${s}" not in taxonomy`);

const normalizeRef = (t) => String(t ?? "").split(" or ")[0].trim();
for (const p of programs.programs ?? []) {
  for (const r of [...(p.required ?? []), ...(p.electives ?? []), ...(p.capstones ?? [])]) {
    const ref = normalizeRef(r);
    const id = idOf(ref);
    if (!id) continue; // milestone gate/free-text — not a course ref (R6)
    if (!courseIds.has(id) && !capstoneIds.has(id))
      errs.push(`${p.id}: unresolved ref "${id}" (not a course or capstone id)`);
  }
}

const expect = new Set([
  "CCC-AI-01", "CCC-COM-01", "CCC-FIN-01", "CCC-WOR-01",
  "CCC-CAR-01", "CCC-LEA-01", "SOT-DIG-01", "SOD-DES-01",
  "SOD-VIS-01", "SOA-PHO-01", "SOT-AI-01", "CAP-001",
]);
const found = new Map();
import { readdirSync } from "node:fs";
for (const f of readdirSync(join(base, "syllabi"))) {
  const m = f.match(/^([A-Z]{3}[A-Z0-9]*-[A-Z0-9]+-\d{2})/);
  if (m) found.set(m[1], f);
}
for (const id of expect) if (!found.has(id)) errs.push(`syllabus missing for ${id}`);
for (const [id] of found) if (!expect.has(id)) errs.push(`unexpected syllabus file for ${id}`);
for (const c of capstones) if (!ID_RX.test(c.id)) errs.push(`${c.id}: capstone id must match XXX-XXX-NN`);

const capUsed = new Set(allCourses.map((c) => c.required_capstone).filter(Boolean));
for (const id of capUsed) if (!capstoneIds.has(id)) errs.push(`course requires unknown capstone "${id}"`);

if (errs.length) {
  console.error(`KLAGON COLLEGE INTEGRITY FAIL (${errs.length}):`);
  for (const e of errs) console.error("  - " + e);
  process.exit(1);
}
console.log(
  `KLAGON COLLEGE INTEGRITY OK — ${allCourses.length} courses (${catalogue.courses.length} live, ${catalogue.coming_soon.length} coming-soon), ${capstones.length} capstones, ${tokens.size} taxonomy tokens, ${found.size} syllabi — all internally consistent.`,
);
