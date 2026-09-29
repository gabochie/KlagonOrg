#!/usr/bin/env node
/**
 * Suggest a commit message from what is actually staged.
 *
 * Why this exists: the repo's last 60 commits had 54 useless subjects
 * ("sdfghj", "VNM", "fghjkl;"), and on a site that redeploys itself every night
 * from main, "sdfghj" is the difference between a two-minute revert and a
 * mystery. The previous conventional-commit entries in the log are the six this
 * is trying to make the norm.
 *
 * Deliberately deterministic: no network, no API key, no model. It reads the
 * staged diff and reports what is genuinely there. It never invents a narrative
 * about *why* a change was made, because it cannot know that, and a plausible
 * lie is worse than an honest file list.
 *
 * Used two ways:
 *   node scripts/suggest-commit-message.mjs            -> print a message
 *   node scripts/suggest-commit-message.mjs --check F  -> rewrite F if weak
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const CONVENTIONAL =
  /^(feat|fix|chore|docs|refactor|test|perf|build|ci|style|revert)(\([a-z0-9._/-]+\))?!?: .+/;

/**
 * Verbs that only describe *that* a file was touched, never what changed.
 * Paired with a filename they are what GitHub Desktop's own default title looks
 * like ("Update rss.xml"), which is why it gets rewritten. On its own it is not
 * enough: "add claim queue" is a real sentence and must be left alone.
 */
const FILE_VERB =
  /^(update|updated|updating|add|added|create|created|change|changed|edit|edited|modify|modified|rename|delete|removed|remove|fix|fixed|fixing)\b/i;

/** "Update rss.xml", "Create TrackLink.tsx" — a short title ending in a filename. */
function isFileTouchOnly(subject) {
  const words = subject.trim().split(/\s+/);
  if (words.length > 4) return false;
  return /\.[A-Za-z0-9]{1,6}$/.test(words[words.length - 1]);
}

/** Path segments too generic to describe a change. */
const GENERIC = new Set([
  "src", "app", "lib", "components", "sections", "data", "public", "e2e",
  "supabase", "migrations", "scripts", "workflows", "tests", "test", "pages",
  "workers", "content", "types", "assets", "out", "node_modules",
]);

function git(...args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

/**
 * A subject is "weak" when it tells a future reader nothing. Not a length rule
 * alone: "fix typo" is short and fine, while "Update rss.xml" is long and says
 * nothing. Keyboard mashing is caught structurally instead — a single
 * space-free run of letters is not an English commit message.
 */
export function isWeakSubject(subject) {
  const t = (subject ?? "").trim();
  if (!t) return true;
  if (FILE_VERB.test(t) && isFileTouchOnly(t)) return true;
  // Keyboard mashing, caught structurally: a single space-free run of letters is
  // not an English commit message.
  if (!/\s/.test(t) && /^[A-Za-z]+$/.test(t)) return true;
  if (t.length < 10 && !/\s/.test(t)) return true;
  return false;
}

function stagedFiles() {
  const raw = git("diff", "--cached", "--name-only", "--diff-filter=ACMRD");
  return raw ? raw.split("\n").filter(Boolean) : [];
}

function pickScope(files) {
  const counts = new Map();
  for (const f of files) {
    for (const seg of f.split("/").slice(0, -1)) {
      if (GENERIC.has(seg)) continue;
      // A dotfile directory (.githooks) is plumbing, not an area of the product.
      if (seg.startsWith(".")) continue;
      counts.set(seg, (counts.get(seg) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return "";
  // Highest count wins; alphabetical tie-break so output is stable run to run.
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function pickType(files) {
  if (files.length === 0) return "chore";
  const isTest = (f) => /(^|\/)(e2e|tests?)\//.test(f) || /\.(spec|test)\.[cm]?[jt]sx?$/.test(f);
  const isDoc = (f) => /\.(md|mdx)$/.test(f);
  const isChore = (f) =>
    /^(supabase\/|scripts\/|\.github\/|\.githooks\/|public\/)/.test(f) ||
    /^(package(-lock)?\.json|tsconfig.*\.json|.*\.config\.[cm]?[jt]s|eslint.*|\.gitignore)$/.test(f);
  if (files.every(isTest)) return "test";
  if (files.every(isDoc)) return "docs";
  if (files.every(isChore)) return "chore";
  return "feat";
}

function pickHeadline(files, added) {
  if (files.length === 0) return "update";
  // A brand new file is the most informative thing in a diff, so lead with it.
  const lead = added[0] ?? files[0];
  const base = lead.split("/").pop().replace(/\.[^.]+$/, "");
  const verb = files.length > 0 && added.length === files.length ? "add" : "update";
  const rest = files.length > 1 ? ` +${files.length - 1} more file${files.length > 2 ? "s" : ""}` : "";
  return `${verb} ${base}${rest}`;
}

export function suggest(files = stagedFiles(), meta = {}) {
  const added = meta.added ?? git("diff", "--cached", "--name-only", "--diff-filter=A").split("\n").filter(Boolean);
  const stat = meta.stat ?? git("diff", "--cached", "--shortstat");

  const type = pickType(files);
  const scope = pickScope(files);
  const head = `${type}${scope ? `(${scope})` : ""}: ${pickHeadline(files, added)}`;

  const body = [];
  if (stat) body.push(stat);
  if (files.length) {
    body.push("");
    for (const f of files.slice(0, 12)) body.push(`- ${f}`);
    if (files.length > 12) body.push(`- ...and ${files.length - 12} more`);
  }
  return `${head}\n\n${body.join("\n")}\n`;
}

// CLI. Guarded so that importing this module — as the tests and the commit-msg
// hook do — has no side effects.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const arg = process.argv[2];
  if (arg === "--check") {
    const file = process.argv[3];
    if (!file) {
      console.error("usage: --check <commit-msg-file>");
      process.exit(0);
    }
    let current = "";
    try {
      current = readFileSync(file, "utf8");
    } catch {
      process.exit(0);
    }
    const subject = current.split("\n")[0] ?? "";
    // Never second-guess a message that already follows the convention.
    if (CONVENTIONAL.test(subject.trim()) || !isWeakSubject(subject)) process.exit(0);

    const files = stagedFiles();
    if (files.length === 0) process.exit(0);

    const next = suggest(files);
    // Preserve any body the author bothered to write.
    const rest = current.split("\n").slice(1).join("\n").trim();
    writeFileSync(file, next + (rest ? `\n${rest}\n` : ""), "utf8");
    console.error(
      [
        "",
        "  Auto-titled this commit. Your message said nothing recoverable, so it was",
        "  replaced with one derived from the staged diff:",
        "",
        ...next.trimEnd().split("\n").map((l) => `    ${l}`),
        "",
        "  If that is wrong or too vague, amend it:",
        '    git commit --amend -m "feat(scope): what this actually does"',
        "",
      ].join("\n"),
    );
  } else {
    const files = stagedFiles();
    if (files.length === 0) {
      console.log("Nothing staged. Stage something first:  git add -A");
    } else {
      process.stdout.write(suggest(files));
    }
  }
}
