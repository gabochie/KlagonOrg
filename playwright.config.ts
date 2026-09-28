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
  use: {
    // 3210 is arbitrary but deliberate: this machine already runs other apps'
    // servers (3000 and 3100 were both taken by other projects), and a
    // collision silently served the wrong site to the whole suite.
    baseURL: "http://localhost:3210",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
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
