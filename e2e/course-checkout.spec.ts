import { test, expect } from "@playwright/test";

/**
 * Paid course gating on the public learning pages.
 *
 * The site is a static export, so paid lesson content must never be baked into
 * the HTML at build time. Instead a paid course ships a client gate that asks
 * the database for an entitlement; free courses keep shipping their lessons.
 *
 * The paid-path assertions need a course that already has a price in the build,
 * which the default fixture set does not have, so they are skipped unless
 * E2E_PAID_COURSE_ID names one. The free-path test always runs and guards the
 * regression that matters most: a free course must never be gated.
 */

test("free courses are not gated in the public build", async ({ page }) => {
  await page.goto("/learning");
  await page
    .getByText("Phone Ready - Start IT with Phone", { exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/learning\/[0-9a-f-]{36}/, { timeout: 20000 });

  // Lessons render and there is no paid gate.
  await expect(page.getByText(/Your Phone is Your First Computer Lab/).first()).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByText(/Get lifetime access for GH/)).toHaveCount(0);
  await expect(page.getByText(/Sign in to unlock this course/)).toHaveCount(0);
});

test("paid courses gate lessons behind sign-in", async ({ page }) => {
  const id = (process.env.E2E_PAID_COURSE_ID ?? "").trim();
  test.skip(!id, "set E2E_PAID_COURSE_ID to a priced, built course to run this");

  await page.goto(`/learning/${id}`);

  // The gate shows the server price and requires an account before checkout.
  await expect(page.getByText(/Get lifetime access for GH/)).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/Sign in to unlock this course/)).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("link", { name: /Create free account/ })).toBeVisible();

  // No lesson material may leak next to the paywall.
  await expect(page.getByText(/Check yourself · pass \d+\/\d+/)).toHaveCount(0);
});
