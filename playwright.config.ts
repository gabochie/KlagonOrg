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
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
