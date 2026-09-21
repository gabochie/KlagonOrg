import { defineConfig, devices } from "@playwright/test";

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
