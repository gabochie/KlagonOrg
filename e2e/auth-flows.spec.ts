import { test, expect, type Page } from "@playwright/test";

/**
 * Authenticated flows (member submits → admin moderates → public shows it).
 *
 * TODO: needs throwaway accounts. Create them once in Supabase Auth,
 * export the four env vars below, and remove the test.skip lines:
 *   E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD (role: member)
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   (role: admin)
 *
 * Planned specs in this file:
 *   - submit-moderate-publish: member post goes pending → approved → /news
 *   - rsvp: member RSVPs, spots-left drops, no double count
 *   - member-login / admin-login / super-login: landing per role
 */
async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in/i }).click();
}

test.skip("submit-moderate-publish goes pending to live", async ({ page }) => {
  if (!process.env.E2E_MEMBER_EMAIL || !process.env.E2E_ADMIN_EMAIL) {
    test.skip(true, "needs E2E_MEMBER_EMAIL + E2E_ADMIN_EMAIL");
  }
  await login(page, process.env.E2E_MEMBER_EMAIL as string, process.env.E2E_MEMBER_PASSWORD as string);
  await expect(page).toHaveURL(/\/dashboard\/member/, { timeout: 15000 });
  // …submit via /submit, assert pending in /my/posts…
});

test.skip("admin lands on admin dashboard", async ({ page }) => {
  if (!process.env.E2E_ADMIN_EMAIL) test.skip(true, "needs E2E_ADMIN_EMAIL");
  await login(page, process.env.E2E_ADMIN_EMAIL as string, process.env.E2E_ADMIN_PASSWORD as string);
  await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 15000 });
});
