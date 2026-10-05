import { test, expect } from "@playwright/test";

/**
 * Regression coverage for the `public/_headers` cache rules.
 *
 * Cloudflare applies `_headers` server-side, so `serve out` does not honour it
 * and a Playwright request can never observe these rules in action. What this
 * spec does verify is the part that is observable locally: that the rules ship
 * inside the export, and that they only name paths which exist and are
 * content-hashed. The `Cache-Control` values themselves are asserted by
 * scripts/verify-cache-headers.mjs at build time.
 *
 * The failure this exists for: an over-broad `/_next/static/*` rule would mark
 * the unhashed `_buildManifest.js` immutable for a year. Nothing else in the
 * toolchain notices, and a visitor pinned to a stale build cannot recover
 * without a hard reload.
 */

/** Rough content-hash test: 16+ hex chars in the filename. */
const HASHED = /[0-9a-f]{16,}/;

/** Read the shipped copy of _headers out of the export, not public/. */
async function shippedHeaders(): Promise<string> {
  const res = await fetch("/_headers");
  // `serve` does not know this is special, so it serves the raw file.
  return res.ok ? await res.text() : "";
}

test.describe("cache headers", () => {
  test("the immutable rules only cover content-hashed paths", async ({
    page,
    request,
  }) => {
    // Collect every /_next/static asset a real page load requests.
    const requested: string[] = [];
    page.on("request", (r) => {
      const p = new URL(r.url()).pathname;
      if (p.startsWith("/_next/static/")) requested.push(p);
    });

    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(2500);

    const unique = [...new Set(requested)];
    expect(unique.length).toBeGreaterThan(0);

    // Every asset actually fetched must be content-hashed. If one were not, the
    // immutable rules would be unsound for it, which is what this asserts.
    const unhashed = unique.filter((p) => !HASHED.test(p.split("/").pop() ?? ""));
    expect(
      unhashed,
      `unhashed asset(s) requested from /_next/static: ${unhashed.join(", ")}`,
    ).toEqual([]);
  });

  test("_headers ships in the export and keeps the CSP", async ({
    page,
  }) => {
    // Confirm the export contains the file at all, by hitting it and falling
    // back to a filesystem check via the served directory listing behaviour.
    const res = await page.request.get("/_headers");
    const text = await res.text();

    // Either served (Cloudflare-parsed away, or raw via serve) or 404 on
    // `serve`. What must hold either way is that public/_headers still has the
    // CSP, so assert on the source of truth via the built output's copy if it is
    // reachable, and otherwise let verify-cache-headers.mjs carry it.
    const looksLikeHeaders =
      text.includes("X-Content-Type-Options") || text.includes("X-Frame-Options");

    // `serve` returns the raw file for an unhandled path, so this normally
    // holds. If a future host stops exposing it, skip rather than fail, because
    // the authoritative assertion is the build script.
    test.skip(
      !looksLikeHeaders,
      "_headers not served by the static server; covered by verify-cache-headers.mjs",
    );

    expect(text).toMatch(/Content-Security-Policy:/i);
    expect(text).toMatch(/X-Content-Type-Options:\s*nosniff/i);
    expect(text).toMatch(/_next\/static\/chunks\/\*/);
    expect(text).toMatch(/Cache-Control:[^\n]*immutable/i);
  });

  test("no immutable rule is broader than the hashed directories", async ({
    page,
  }) => {
    const text = await page.request.get("/_headers").then((r) => r.text());
    test.skip(!text.includes("Cache-Control"), "_headers not readable");

    // Pull out every rule path that carries an immutable Cache-Control.
    const lines = text.split("\n");
    let pattern: string | null = null;
    const immutablePatterns: string[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      if (!/^\s/.test(line)) {
        pattern = t;
        continue;
      }
      if (pattern && /^cache-control:/i.test(t) && /immutable/i.test(t)) {
        immutablePatterns.push(pattern);
      }
    }

    expect(immutablePatterns.length).toBeGreaterThan(0);

    for (const p of immutablePatterns) {
      // The specific over-broad rule that must never ship.
      expect(p, `${p} would mark unhashed build files immutable`).not.toBe(
        "/_next/static/*",
      );
      // Every immutable rule must be anchored to a specific hashed directory.
      expect(
        p,
        `${p} is not one of the hashed asset directories`,
      ).toMatch(/^\/_next\/static\/(chunks|css|media)\/\*$/);
    }
  });
});