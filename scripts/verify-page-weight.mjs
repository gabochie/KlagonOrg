#!/usr/bin/env node
/**
 * Caps exported page weight.
 *
 * This exists because a page reached 3.4 MB and took 6.6s and nothing noticed.
 * `/business/` rendered all 743 directory listings into its initial HTML —
 * ~3.1 MB of card markup, duplicating a dataset that was already being shipped
 * to the browser as a serialized prop. Lint passed, typecheck passed, the build
 * passed, and every e2e test passed, because none of them measure bytes.
 *
 * Budgets are deliberately loose. The median page is ~80 KB and the second
 * largest is ~187 KB, so a 1 MB hard fail cannot fire on ordinary content, and
 * `/business/` is data-driven — it will legitimately grow as listings are
 * imported. What must not happen again is a page quietly reaching megabytes.
 *
 * Set BUDGET_FAIL_KB higher only with a reason in the commit that does it.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");

const BUDGET_FAIL_KB = 1024;
const BUDGET_WARN_KB = 400;

if (!fs.existsSync(outDir)) {
  console.error("[verify-page-weight] out/ not found. Run the build first.");
  process.exit(1);
}

const pages = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name === "index.html") {
      pages.push({ kb: fs.statSync(p).size / 1024, route: toRoute(p) });
    }
  }
};

function toRoute(abs) {
  const rel = path.relative(outDir, abs).split(path.sep).join("/");
  const trimmed = rel.replace(/index\.html$/, "");
  return trimmed === "" ? "/" : trimmed;
}

walk(outDir);
pages.sort((a, b) => b.kb - a.kb);

const over = pages.filter((p) => p.kb > BUDGET_WARN_KB);
const fail = pages.filter((p) => p.kb > BUDGET_FAIL_KB);

const median = pages.length ? pages[Math.floor(pages.length / 2)].kb : 0;
const heaviest = pages[0];

for (const p of over) {
  const level = p.kb > BUDGET_FAIL_KB ? "FAIL" : "warn";
  console.log(`[verify-page-weight] ${level}  ${p.kb.toFixed(0)} KB  ${p.route}`);
}

if (fail.length) {
  console.error(
    `[verify-page-weight] ${fail.length} page(s) over the ${BUDGET_FAIL_KB} KB budget.`,
  );
  console.error(
    "[verify-page-weight] Refusing to ship. If a page legitimately needs this " +
      "much markup, window or paginate it rather than raising the budget.",
  );
  process.exit(1);
}

console.log(
  `[verify-page-weight] ok — ${pages.length} pages, median ${median.toFixed(0)} KB, ` +
    `heaviest ${heaviest ? `${heaviest.kb.toFixed(0)} KB ${heaviest.route}` : "n/a"}, ` +
    `budget ${BUDGET_FAIL_KB} KB.`,
);