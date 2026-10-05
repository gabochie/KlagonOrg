import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

/**
 * Load throwaway-account creds for local runs from .env.e2e.local
 * (gitignored). No dotenv dependency — trivial KEY=value parsing.
 * CI injects the same names as job env vars instead.
 * NEXT_PUBLIC_* fall back to .env.local so API-backed steps can reach
 * Supabase without extra setup.
 */
function loadEnvFile(path: string) {
  try {
    const raw = fs.readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [key, ...rest] = trimmed.split("=");
      let value = rest.join("=").trim();
      if (
        value.length >= 2 &&
        ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'")))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // absent file is fine (CI, or unauthenticated runs)
  }
}
loadEnvFile(".env.e2e.local");
loadEnvFile(".env.local");

/**
 * KLAGON e2e. Unauthenticated specs run anywhere against dev.
 * Authenticated specs need E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD
 * (a throwaway member) and E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 * (a throwaway admin) — see e2e/auth.ts. Without them, auth specs
 * skip instead of failing.
 */
export default defineConfig({
  testDir: "./e2e",
  // Generous because the multi-step auth flows chain several sequential
  // round-trips, and Supabase Auth is the slowest hop (~400ms median, with
  // multi-second spikes measured from this machine). See expect.timeout above.
  timeout: 90_000,
  // This was documented but never actually set, so every expect() was using
  // Playwright's 5s default. That is the single biggest source of flakes here:
  // a Supabase Auth round-trip that takes 2s on a good day and 6s on a bad one
  // fails on the bad day and looks like a product bug. 20s still fails fast
  // enough to catch a genuinely broken flow.
  expect: {
    timeout: 20_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  // Refuses to run if the configured port is serving something other than a
  // Klagon static export. See e2e/global-setup.ts.
  globalSetup: "./e2e/global-setup.ts",
  // Sweeps test rows left behind by an interrupted run, so they cannot pile up
  // as publicly visible posts or block real businesses from claiming a listing.
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    // 3210 is arbitrary but deliberate: this machine already runs other apps'
    // servers (3000 and 3100 were both taken by other projects), and a
    // collision silently served the wrong site to the whole suite.
    baseURL: "http://localhost:3210",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // `dashboard-mobile.spec.ts` asserts on the phone-width drawer, whose
      // toggle is `md:hidden`. At Desktop Chrome width the button does not
      // exist, so the spec times out waiting for it rather than testing
      // anything. The reverse is already handled: the mobile project's
      // `testIgnore` keeps auth-heavy specs off the phone projects.
      testIgnore: ["dashboard-mobile.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Mobile viewport coverage, which is the only project that renders the
      // `md:hidden` bottom nav. It found a real bug the desktop project
      // structurally cannot: at 393x727 the install prompt's buttons sat under
      // that bar, and tapping "Install" hit the Businesses tab.
      //
      // Scoped to guest specs on purpose. Every project re-runs every test, and
      // these specs sign in against two shared throwaway accounts via
      // signInWithPassword. Tripling the projects tripled the auth calls and
      // hit Supabase's rate limit: 14 of 15 failures were
      // "member sign-in failed: Request rate limit reached", which then
      // surfaced as bogus toHaveURL / waitForURL product-looking failures.
      // With CI's `retries: 2` that gets worse, not better.
      //
      // Guests are also the right audience here — the nav and install prompt
      // are exactly what a signed-out phone visitor sees.
      //
      // `dashboard-mobile.spec.ts` is the one deliberate exception: it needs a
      // real layout engine and a real focus model, which jsdom does not have, so
      // it cannot be verified anywhere else. It stays in the mobile project
      // rather than running in both, which would double its sign-ins for no
      // extra coverage.
      name: "mobile",
      testIgnore: [
        "auth-flows.spec.ts",
        "boost-fulfilment.spec.ts",
        "boost-request.spec.ts",
        "directory-claim-admin.spec.ts",
        "directory-claim.spec.ts",
        "sponsor-checkout.spec.ts",
      ],
      use: { ...devices["Pixel 5"] },
    },
  ],
  // Serve the real static export instead of `next dev`. Dev cold-compiles every
  // route on first hit, and that compile — not app or database latency — is what
  // pushed the multi-step auth flow past its budget. `out/` is the artifact that
  // actually deploys, so this tests what ships. Run `npm run build` first;
  // `serve` fails loudly if out/ is missing or stale.
  webServer: {
    command: "npx --yes serve out -l 3210 --no-clipboard",
    url: "http://localhost:3210",
    // Never reuse: if something else already owns the port, Playwright would
    // happily point the suite at a stranger's app and report nonsense
    // failures. Failing loudly is the correct outcome.
    reuseExistingServer: false,
    timeout: 180000,
  },
});
