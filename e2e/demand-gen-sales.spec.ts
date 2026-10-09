import { test, expect } from "@playwright/test";

/**
 * Read-only smoke coverage for the demand-gen sales pages (/go/*) and the
 * certificate verification page (/verify). Zero writes, no auth: every test
 * only GETs pages and asserts stranger-visible content, so it is safe
 * against production data. MoMo checkout, WhatsApp handoffs and RPC writes
 * are intentionally NOT covered here — they belong in the mutating lane.
 */

const GO_PAGES = [
  { path: "/go/ai-sprint", price: "GH₵150" },
  { path: "/go/ai-sprint-team", price: "GH₵2,000" },
  { path: "/go/side-business", price: "GH₵150" },
  { path: "/go/freelance", price: "GH₵100" },
  { path: "/go/hire", price: null },
] as const;

for (const { path, price } of GO_PAGES) {
  test(`${path} renders offer with WhatsApp exit`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByText(/WhatsApp us first/).first()).toBeVisible({
      timeout: 20000,
    });
    if (price) {
      await expect(page.getByText(price).first()).toBeVisible({ timeout: 20000 });
    }
    // WhatsApp exit points at the org line, never a personal number.
    const wa = page.locator('a[href*="wa.me/233268708895"]').first();
    await expect(wa).toBeVisible({ timeout: 20000 });
  });
}

test("/go/ai-sprint Enrol points at the paid course, not generic register", async ({
  page,
}) => {
  await page.goto("/go/ai-sprint");
  const enrol = page.getByRole("link", { name: /Enrol in the sprint/ }).first();
  await expect(enrol).toBeVisible({ timeout: 20000 });
  expect(await enrol.getAttribute("href")).toMatch(/^\/learning\/[0-9a-f-]{36}$/);
});

test("sales pages cross-link funnels instead of dead-ending", async ({ page }) => {
  await page.goto("/go/freelance");
  await expect(page.getByRole("link", { name: /side-business/i }).first()).toBeVisible({
    timeout: 20000,
  });
  await page.goto("/go/side-business");
  await expect(page.getByRole("link", { name: /first client/i }).first()).toBeVisible({
    timeout: 20000,
  });
  await page.goto("/go/hire");
  await expect(page.getByRole("link", { name: /Team Sprint/ }).first()).toBeVisible({
    timeout: 20000,
  });
});

test("/verify renders the lookup form and rejects empty codes", async ({ page }) => {
  await page.goto("/verify");
  await expect(page.getByText(/Is this KLAGON certificate real/).first()).toBeVisible({
    timeout: 20000,
  });
  await page.getByRole("button", { name: /Verify certificate/ }).click();
  await expect(page.getByText(/Enter the certificate code/).first()).toBeVisible({
    timeout: 20000,
  });
});

test("/verify reports a miss for a bogus code", async ({ page }) => {
  await page.goto("/verify");
  await page.getByLabel("Certificate code").fill("KLG-XX-000000");
  await page.getByRole("button", { name: /Verify certificate/ }).click();
  await expect(page.getByText(/No certificate found/).first()).toBeVisible({
    timeout: 30000,
  });
});
