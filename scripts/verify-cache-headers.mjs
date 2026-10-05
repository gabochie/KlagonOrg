#!/usr/bin/env node
/**
 * Asserts the `_headers` cache rules only cover files that are safe to cache
 * forever.
 *
 * This exists because `public/_headers` marks `/_next/static/{chunks,css,media}/*`
 * as `immutable` for one year. That is correct only while every file in those
 * directories carries a content hash in its filename, because the hash is what
 * guarantees a changed file is a changed URL. Nothing in the normal toolchain
 * checks that: a new Next.js version, a plugin, or a hand-added asset could
 * introduce an unhashed file, and the first person to find out would be a
 * visitor pinned to a stale build with no way to recover except a hard reload.
 *
 * So the invariant is asserted here rather than left as a comment.
 *
 * Also asserts the inverse, which is the failure that actually bites: that no
 * rule marks an unhashed path immutable. Cloudflare applies every matching rule
 * and joins duplicate headers with a comma, so an over-broad pattern yields an
 * invalid `max-age=31536000, max-age=0` rather than a clean override, and the
 * browser's behaviour then depends on which value it picks.
 *
 * Run from `npm run build`, after `next build`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");
const headersFile = path.join(root, "public", "_headers");

// Directories the immutable rules claim. Kept in sync with public/_headers by
// this script's own failure output, which names the rule that broke.
const IMMUTABLE_DIRS = ["chunks", "css", "media"];

// 16 hex chars is the shortest content hash observed in this build (webpack
// chunk ids are 8, Next's own media hashes are longer). 8 is too short to trust
// because a chunk id is not necessarily a content hash.
const HASH_RE = /[0-9a-f]{16,}/;

if (!fs.existsSync(outDir)) {
  console.error("[verify-cache-headers] out/ not found. Run the build first.");
  process.exit(1);
}

if (!fs.existsSync(headersFile)) {
  console.error("[verify-cache-headers] public/_headers not found.");
  process.exit(1);
}

const headers = fs.readFileSync(headersFile, "utf8");
const errors = [];
const warnings = [];

/**
 * Collect every `Cache-Control` header declared in `_headers`, paired with the
 * path pattern it is declared under.
 */
function declaredCacheRules(text) {
  const rules = [];
  const lines = text.split("\n");
  let pattern = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      pattern = trimmed;
      continue;
    }
    if (pattern && /^cache-control:/i.test(trimmed)) {
      rules.push({ pattern, value: trimmed.replace(/^cache-control:\s*/i, "") });
    }
  }
  return rules;
}

const rules = declaredCacheRules(headers);

// --- 1. Every file under the immutable directories must be content-hashed. ---

const immutablePatterns = rules.filter((r) => /immutable/i.test(r.value));
if (immutablePatterns.length === 0) {
  warnings.push(
    "no immutable Cache-Control rule found; if fingerprinted assets are meant to " +
      "be cached for a year, public/_headers is missing the rule",
  );
}

for (const dir of IMMUTABLE_DIRS) {
  const dirPath = path.join(outDir, "_next", "static", dir);
  if (!fs.existsSync(dirPath)) {
    warnings.push(`/_next/static/${dir} not present in this build`);
    continue;
  }

  const files = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else files.push(p);
    }
  })(dirPath);

  if (files.length === 0) {
    warnings.push(`/_next/static/${dir} is empty in this build`);
    continue;
  }

  const unhashed = files.filter((f) => !HASH_RE.test(path.basename(f)));
  if (unhashed.length > 0) {
    errors.push(
      `/_next/static/${dir}/* is served immutable but ${unhashed.length} ` +
        `file(s) in it have no content hash:\n` +
        unhashed.map((f) => `      ${path.relative(outDir, f)}`).join("\n") +
        `\n    Caching these for a year would pin visitors to a stale build.\n` +
        `    Either exclude the path in public/_headers or remove the rule.`,
    );
  }
}

// --- 2. No immutable rule may be broader than the hashed directories. ---

const staticRoot = path.join(outDir, "_next", "static");

// Every file under /_next/static that is NOT content-hashed, by its URL path.
// Used to catch an over-broad rule like `/_next/static/*`.
function unhashedUnderStatic() {
  const out = [];
  (function walk(d) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (!HASH_RE.test(path.basename(p))) {
        out.push("/" + path.relative(outDir, p).split(path.sep).join("/"));
      }
    }
  })(staticRoot);
  return out;
}

const unhashedStatic = unhashedUnderStatic();

for (const rule of immutablePatterns) {
  // Turn the Cloudflare pattern into a matcher for a concrete URL path.
  // Single splat only, which is all Cloudflare permits anyway.
  const source =
    "^" + rule.pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$";

  for (const urlPath of unhashedStatic) {
    if (new RegExp(source).test(urlPath)) {
      errors.push(
        `rule "${rule.pattern}" is immutable but also matches the unhashed ` +
          `file ${urlPath}.\n` +
          `    Cloudflare joins duplicate Cache-Control values with a comma, so ` +
          `this produces an invalid header rather than a clean override.`,
      );
    }
  }
}

// --- 3. The security headers must survive. ---

// Cheap guard against an edit that truncates the file and silently drops the
// CSP, which is the whole reason the other rules here matter less than that one.
if (!/content-security-policy:/i.test(headers)) {
  errors.push("public/_headers no longer declares Content-Security-Policy");
}
if (!/x-content-type-options:\s*nosniff/i.test(headers)) {
  errors.push("public/_headers no longer declares X-Content-Type-Options: nosniff");
}

for (const w of warnings) console.log(`[verify-cache-headers] warn  ${w}`);

if (errors.length > 0) {
  console.error("[verify-cache-headers] FAILED:");
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

const hashedCount = (function count(d) {
  let n = 0;
  for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, entry.name);
    if (entry.isDirectory()) n += count(p);
    else if (HASH_RE.test(path.basename(p))) n++;
  }
  return n;
})(staticRoot);

console.log(
  `[verify-cache-headers] ok — ${immutablePatterns.length} immutable rule(s) ` +
    `cover only content-hashed paths; ${hashedCount} hashed asset(s) verified, ` +
    `${unhashedStatic.length} unhashed correctly excluded.`,
);