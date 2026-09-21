import { test, expect } from "@playwright/test";

/**
 * The Culture Hub as a stranger sees it: brand, fairness copy,
 * festival calendar for all peoples.
 */
test("hub shows brand, custodianship and festival calendar", async ({ page }) => {
  await page.goto("/culture");
  await expect(page.getByText("The Culture Hub", { exact: true }).first()).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByText(/stands on Ga-Dangme land/)).toBeVisible();
  await expect(page.getByText(/festival year/)).toBeVisible();
  for (const name of ["Homowo", "Hogbetsotso", "Damba", "Adae Kese", "Fetu Afahye"]) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
});

test("guest RSVP attempt asks for sign-in", async ({ page }) => {
  await page.goto("/culture");
  // Wait for the hub to finish loading before deciding the verdict.
  await expect(page.getByText(/Upcoming cultural events|stage is being set/)).toBeVisible({
    timeout: 15000,
  });
  const rsvp = page.getByRole("button", { name: /RSVP|Going/ }).first();
  if ((await rsvp.count()) === 0) test.skip(true, "no live culture events right now");
  await rsvp.click();
  await expect(page.getByText(/Sign in to RSVP/)).toBeVisible();
});
