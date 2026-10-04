#!/usr/bin/env node
/**
 * Locks down the RSC flight payloads.
 *
 * `output: "export"` makes Next.js write one `<route>/index.txt` beside every
 * `index.html` -- 987 of them on this site. They are the React Server
 * Components wire format, served as `text/plain`. The client router prefetches
 * them for every visible `<Link>`, which is load-bearing: delete or block them
 * and every internal link becomes a full page load.
 *
 * The risk is the opposite one. They are publicly reachable 200s, so a crawler
 * can index one and a search result can send a human to a wall of gibberish.
 *
 * Two independent guards, because they do different jobs and neither covers
 * the other:
 *
 *   1. `X-Robots-Tag: noindex` in public/_headers -- what actually de-indexes.
 *      A robots.txt Disallow only prevents crawling; it does not remove a URL
 *      that is already indexed or that arrives via an external link.
 *   2. `/*.txt$` in the robots Disallow list -- crawl-budget hygiene, so
 *      crawlers stop spending requests on 987 non-content files.
 *
 * Also asserts the sitemap never advertises a `.txt`, which would be an
 * on-page invitation to index them.
 *
 * Deliberately does NOT check that the files exist. Their absence is the
 * failure mode that hurts users, and `verify-prerender.mjs` already fails the
 * build on missing pages.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];

function read(rel) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    failures.push(`missing file: ${rel}`);
    return "";
  }
  return fs.readFileSync(abs, "utf8");
}

// 1. _headers must send noindex on .txt
const headers = read("public/_headers");
const headersBlocks = headers.split(/\r?\n\r?\n/);
const txtBlock = headersBlocks.find((b) => /^\/\*\.txt\s*$/m.test(b.trim()));
if (!txtBlock) {
  failures.push('public/_headers has no "/*.txt" rule block');
} else if (!/X-Robots-Tag:\s*noindex/i.test(txtBlock)) {
  failures.push('public/_headers "/*.txt" rule is missing X-Robots-Tag: noindex');
}

// 2. robots.txt must disallow .txt
const robots = read("src/app/robots.ts");
if (!/\/\*\.txt\$?/.test(robots)) {
  failures.push('src/app/robots.ts does not disallow "/*.txt$"');
}

// 3. sitemap must not advertise any .txt
const sitemap = read("out/sitemap.xml");
const txtUrls = [...sitemap.matchAll(/<loc>([^<]*\.txt)<\/loc>/g)].map((m) => m[1]);
if (txtUrls.length) {
  failures.push(
    `sitemap advertises ${txtUrls.length} .txt URL(s), first: ${txtUrls[0]}`,
  );
}

// Report what the guards are protecting, so the output is honest about scope.
const outDir = path.join(root, "out");
let payloadCount = 0;
if (fs.existsSync(outDir)) {
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name === "index.txt") payloadCount++;
    }
  };
  walk(outDir);
}

if (failures.length) {
  console.error(
    `[verify-flight-payloads] ${failures.length} problem(s) found:`,
  );
  for (const f of failures) console.error(`  - ${f}`);
  console.error(
    "[verify-flight-payloads] Refusing to ship: RSC flight payloads would be indexable.",
  );
  process.exit(1);
}

console.log(
  `[verify-flight-payloads] ok — ${payloadCount} flight payload(s) present, all noindex and disallowed, sitemap clean.`,
);