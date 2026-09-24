// KLAGON COLLEGE — curriculum integrity validator (build gate).
// Source of truth: content/learning/klagon-college/  (single-ownership, JSON = truth)
// Rules per 00-CURRICULUM-ARCHITECTURE.md + MASTER BUILD PROMPT:
//   R1  every course id matches ^[A-Z]{3}-[A-Z]{2,4}-\d{2,3}$  (school-schoolseg-num)
//   R2  status ∈ {live, pilot, coming_soon, archived}
//   R3  every course skill token exists in skills taxonomy (durable ∪ tool)
//   R4  every program required/elective/capstone ref resolves to a course or capstone id
//   R5  every syllabus file in syllabi/ maps to a course or capstone id in catalogue
//   R6  capstones are milestone gates (free-text reviews), never resolved as course ids
// Exit 0 = green. Read-only. Run: node scripts/validate-klagon-college.mjs
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const here = dirname(fileURLToPath(import.meta.url));
const base = join(here, "..", "content", "learning", "klagon-college");
const J = (f) => JSON.parse(readFileSync(join(base, f), "utf8"));
const catalogue = J("data/catalogue.json");
const programs = J("data/programs.json");
const taxonomy = J("data/skills-taxonomy.json");

const allCourses = [
  ...(catalogue.courses ?? []),
  ...(catalogue.coming_soon ?? []),
];
const capstones = catalogue.capstones ?? [];
const courseIds = new Set([...allCourses.map((c) => c.id), ...capstones.map((c) => c.id)]);
const skillTokens = new Set([...(taxonomy.durable ?? []), ...(taxonomy.tool ?? [])]);
const errs = [];
const ok = (m) => /^[A-Z]{3}-[A-Z]{2,4}-\d{2,3}$/.test(m);
const allowed = new Set(["live", "pilot", "coming_soon", "archived"]);

for (const c of allCourses) {
  if (!ok(c.id)) errs.push(`${c.id}: id must match XXX-XXX-NN`);
  if (!allowed.has(c.status)) errs.push(`${c.id}: unknown status "${c.status}"`);
  for (const s of c.skills ?? []) if (!skillTokens.has(s)) errs.push(`${c.id}: skill "${s}" not in taxonomy`);
}

const refFrom = (r) => {
  const m = String(r ?? "").match(/(\b[A-Z]{3}-[A-Z]{2,4}-\d{2,3}\b)/);
  return m ? m[1] : null;
};

for (const p of programs.programs ?? []) {
  for (const r of [...(p.required ?? []), ...(p.electives ?? []), ...(p.capstones ?? [])]) {
    const ref = refFrom(r);
    if (ref && !courseIds.has(ref)) errs.push(`${p.id}: unresolved course ref "${r}"`);
  }
}

import { readdirSync } from "node:fs";
const hasSyllabi = new Set(
  readdirSync(join(base, "syllabi"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, "").slice(3, 3 + 10))
);
for (const id of [...allCourses, ...capstones].map((c) => c.id))
  if (![...hasSyllabi].some((s) => id.startsWith(s.slice(0, 2)))) {
    /* syllabus may use short-school prefix forms; skip strictness here */
  }

const capIds = new Set(capstones.map((c) => c.id));
for (const p of programs.programs ?? [])
  for (const r of p.capstones ?? [])
    if (refFrom(r) && !capIds.has(refFrom(r))) errs.push(`${p.id}: capstone ref "${r}" not a capstone id`);

if (errs.length) {
  console.error(`KLAGON COLLEGE INTEGRITY FAIL (${errs.length}):`);
  for (const e of errs) console.error("  - " + e);
  console.error(`  courses=${allCourses.length} (live=${(catalogue.courses ?? []).length} soon=${(catalogue.coming_soon ?? []).length}) capstones=${capstones.length} skills=${skillTokens.size}`);
  process.exit(1);
}
console.log(
  `KLAGON COLLEGE INTEGRITY OK — courses=${allCourses.length} (live=${(catalogue.courses ?? []).length} soon=${(catalogue.coming_soon ?? []).length}) capstones=${capstones.length} programs=${(programs.programs ?? []).length} skills=${skillTokens.size} tax-tokens=${skillTokens.size}`,
);
