import { test, expect } from "@playwright/test";

/**
 * Read-only smoke coverage for the IT Tracks 0+1 + Volunteer Program
 * (Phases A–F). Zero writes, no auth: every test below only GETs pages
 * and asserts stranger-visible content, so it is safe against production
 * data. Write paths (apply, quiz submit, hours log, reviews) are
 * intentionally NOT covered here — they award XP, badges and
 * notifications that cannot be cleaned up.
 */

test("learning hub lists the IT track courses", async ({ page }) => {
  await page.goto("/learning");
  for (const title of [
    "Phone Ready - Start IT with Phone",
    "Build Your First Web Page",
    "Forms, Photos & Tables",
    "Publish Pro Site",
  ]) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible({
      timeout: 20000,
    });
  }
});

test("IT course page renders lessons with an interactive quiz gate", async ({ page }) => {
  await page.goto("/learning");
  await page
    .getByText("Phone Ready - Start IT with Phone", { exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/learning\/[0-9a-f-]{36}/, { timeout: 20000 });
  // Lesson list renders (title appears in sidebar and main panel).
  await expect(page.getByText(/Your Phone is Your First Computer Lab/).first()).toBeVisible({
    timeout: 20000,
  });
  // Quiz block renders with pass mark and options.
  await expect(page.getByText(/Check yourself · pass \d+\/\d+/).first()).toBeVisible({
    timeout: 20000,
  });
  // Completion is gated behind the quiz for signed-out strangers too.
  await expect(
    page.getByText(/Pass the quiz above .* to complete this lesson/),
  ).toBeVisible({ timeout: 20000 });
});

test("volunteer page lists claimable open roles", async ({ page }) => {
  await page.goto("/volunteer");
  await expect(page.getByText("Open roles — claimable now")).toBeVisible({
    timeout: 20000,
  });
  const claims = page.getByRole("link", { name: /Claim this role/ });
  expect(await claims.count()).toBeGreaterThan(0);
  // Unpaid + probation terms are stated up front, not buried.
  await expect(page.getByText(/30-day probation/).first()).toBeVisible();
});

test("volunteer apply page gates strangers to sign-in (form is member-only)", async ({
  page,
}) => {
  await page.goto("/volunteer/apply?role=Smoke%20Test%20Role");
  await expect(page.getByText("Apply: Smoke Test Role")).toBeVisible({ timeout: 20000 });
  // Strangers get the sign-in prompt, not the ID/photo/terms form.
  await expect(page.getByText("Sign in to apply")).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("link", { name: /Create free account/ })).toBeVisible();
});

test("volunteer terms page states unpaid service and probation", async ({ page }) => {
  await page.goto("/volunteer/terms");
  await expect(
    page.getByText("Volunteer Terms & Conditions", { exact: true }).first(),
  ).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("Thirty-day probation")).toBeVisible();
  await expect(page.getByText("Unpaid service")).toBeVisible();
});

test("team page renders roster or forming state", async ({ page }) => {
  await page.goto("/team");
  await expect(page.getByText("The people behind KLAGON.org.")).toBeVisible({
    timeout: 20000,
  });
});

test("admin volunteers page bounces strangers to admin login", async ({ page }) => {
  await page.goto("/dashboard/admin/volunteers");
  await expect(page).toHaveURL(/\/admin\/login/, { timeout: 15000 });
});

test("impact page renders live program numbers", async ({ page }) => {
  await page.goto("/impact");
  await expect(page.getByText("Proof, not promises.")).toBeVisible({ timeout: 20000 });
  for (const label of [
    "Free courses live",
    "Lessons published",
    "Volunteers on the team",
    "Open volunteer roles",
  ]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible({ timeout: 20000 });
  }
});

test("donate page offers Community Circle and diaspora channel", async ({ page }) => {
  await page.goto("/donate");
  await expect(page.getByText("The Community Circle")).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: /Card \/ bank \(diaspora\)/ })).toBeVisible({
    timeout: 20000,
  });
});

test("sponsor page prefills interest from track and role links", async ({ page }) => {
  await page.goto("/sponsor?interest=Course%3A%20Build%20Your%20First%20Web%20Page");
  await expect(page.getByText("You're enquiring about:")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText(/Course: Build Your First Web Page/)).toBeVisible({
    timeout: 20000,
  });
});

test("donate page offers in-kind gifts alongside cash", async ({ page }) => {
  await page.goto("/donate");
  await expect(page.getByText("Give goods, skills or space")).toBeVisible({
    timeout: 20000,
  });
  await expect(
    page.getByRole("button", { name: /Devices \(laptops, phones, tablets\)/ }),
  ).toBeVisible({ timeout: 20000 });
});

test("homepage carries donate above the fold with proof link", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /Donate/ }).first()).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByText(/Keep Klagon online/)).toBeVisible({ timeout: 20000 });
});

test("blog articles end with a conversion block", async ({ page }) => {
  await page.goto("/blog/volunteering-build-skills-and-career-in-ghana");
  await expect(page.getByText("This story was made possible by people like you.")).toBeVisible({
    timeout: 20000,
  });
  await expect(page.getByRole("link", { name: /Donate/ }).first()).toBeVisible({
    timeout: 20000,
  });
});
