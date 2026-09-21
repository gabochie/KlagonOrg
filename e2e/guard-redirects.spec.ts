import { test, expect } from "@playwright/test";

/**
 * Route guards without any session. Proves strangers cannot see
 * privileged dashboards — the permission gate bounces them to login.
 */
test("super dashboard bounces strangers to admin login", async ({ page }) => {
  await page.goto("/dashboard/super");
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 });
});

test("admin dashboard bounces strangers to admin login", async ({ page }) => {
  await page.goto("/dashboard/admin");
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 });
});

test("member dashboard bounces strangers to member login", async ({ page }) => {
  await page.goto("/dashboard/member");
  await expect(page).toHaveURL(/\/auth\/login/, { timeout: 15000 });
});

test("moved command center bounces strangers to admin login", async ({ page }) => {
  await page.goto("/dashboard/admin/ops");
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 });
});
