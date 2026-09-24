// seed-klagon-college.mjs — emits idempotent skill-token inserts for the
// Klagon College pilot, compiled from data/skills-taxonomy.json (single source
// of truth). Extends, never destroys. Never hand-types tokens.
//   node scripts/seed-klagon-college.mjs            # prints SQL to stdout
//   node scripts/seed-klagon-college.mjs --dry-run  # prints row counts only
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const taxonomyPath = join(__dirname, '..', 'content', 'learning', 'klagon-college', 'data', 'skills-taxonomy.json');

const taxonomy = JSON.parse(readFileSync(taxonomyPath, 'utf8'));
const dryRun = process.argv.includes('--dry-run');

const rows = [];
for (const category of ['durable', 'tool']) {
  for (const token of taxonomy[category] ?? []) {
    const label = String(token).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    rows.push([token, category, label]);
  }
}

if (dryRun) {
  console.log(`tokens=${rows.length} durable=${(taxonomy.durable ?? []).length} tool=${(taxonomy.tool ?? []).length}`);
  console.log('schema+capstone come from supabase/migrations/20260926000000_klagon_college_pilot_seed.sql');
  process.exit(0);
}

const values = rows.map(([t, c, l]) => `  ('${t}','${c}','${l.replace(/'/g, "''")}')`).join(',\n');
console.log(`insert into public.skill_tokens (token, category, label) values
${values}
on conflict (token) do nothing;`);
