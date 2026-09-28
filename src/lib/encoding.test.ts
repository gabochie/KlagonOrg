import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Guards source files against mojibake.
 *
 * The repo's build step is documented as byte-stable and mojibake-free, and it
 * stays that way only as long as every write to a source file preserves UTF-8.
 * A whole-file rewrite through a non-UTF-8-aware tool (PowerShell 5.1's
 * Get-Content/Set-Content round-trip is the usual culprit) silently re-encodes
 * every non-ASCII character: em dashes become "aEUR", lightning bolts become
 * "aá§". Nothing fails — the result is still valid UTF-8, so typecheck, lint,
 * tests and the build all pass while the site renders garbage.
 *
 * This test is the only thing that catches it.
 */

const SRC = join(__dirname, "..");
const SKIP_DIRS = new Set(["node_modules", ".next", "out", ".git"]);
const TEXT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".json", ".sql", ".css", ".md"]);

/** Characters that only appear in text that has been decoded with the wrong codec. */
/**
 * The signature of text that has been decoded with the wrong codec: a lead
 * byte (the first half of a multi-byte UTF-8 sequence) followed by another
 * byte in the ranges those sequences produce. Written with \u escapes so this
 * guard's own source stays pure ASCII and cannot itself be corrupted.
 */
const MOJIBAKE = /[\u00C2\u00C3\u00E2\u00F0][\u0080-\u00FF\u2000-\u20FF]/;

function* walk(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (TEXT_EXT.has(full.slice(full.lastIndexOf(".")))) yield full;
  }
}

describe("source encoding", () => {
  it("contains no text that was re-encoded with the wrong codec", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      // Read as bytes and decode strictly: a file that is not valid UTF-8 at
      // all should fail here too rather than render as replacement chars.
      const buf = readFileSync(file);
      const text = new TextDecoder("utf-8", { fatal: true }).decode(buf);
      if (MOJIBAKE.test(text)) offenders.push(relative(SRC, file));
    }
    expect(
      offenders,
      "these files show signs of UTF-8 being re-encoded; rewrite them with a UTF-8-safe editor",
    ).toEqual([]);
  });
});
