import { test, expect } from "@playwright/test";

/**
 * The business directory as a reader sees it, plus the paid-placement rules.
 *
 * The directory is a reader-controlled product: search, category and sort all
 * belong to the person looking for a business. Sponsored partners are shown in
 * their own labelled block and must never be injected into, or reorder, the
 * organic results.
 */
test("directory lists businesses and keeps sponsored partners separate", async ({ page }) => {
  await page.goto("/business");

  await expect(page.getByTestId("directory-sponsored")).toBeVisible({ timeout: 15000 });

  // The placement is disclosed, not disguised.
  await expect(page.getByText("Partners supporting Klagon")).toBeVisible();
  await expect(page.getByText(/not ranked by the directory/)).toBeVisible();

  // Every partner links to a profile that actually exists in the export.
  const profiles = page.getByTestId("directory-sponsored").locator('a[href^="/business/"]');
  const count = await profiles.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const href = await profiles.nth(i).getAttribute("href");
    expect(href).toBeTruthy();
    const slug = href!.replace(/^\/business\//, "").replace(/\/$/, "");
    const res = await page.request.get(href!);
    expect(res.status(), `sponsor profile ${href} should exist`).toBe(200);
    expect(slug).toMatch(/^[a-z0-9-]+$/);
  }
});

test("each sponsor is credited its own impression, not just the first", async ({ page }) => {
  await page.goto("/business");
  const block = page.getByTestId("directory-sponsored");
  await expect(block).toBeVisible({ timeout: 15000 });

  // The block sits below the fold; impressions are viewability-gated, so the
  // reader has to actually reach it.
  await block.scrollIntoViewIfNeeded();
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const raw = sessionStorage.getItem("klagon_ad_impressions");
          const seen: string[] = raw ? JSON.parse(raw) : [];
          return seen.filter((k) => k.startsWith("directory-sponsored:")).length;
        }),
      { timeout: 10000 },
    )
    .toBeGreaterThanOrEqual(3);

  // Every card names the tier the partner paid for.
  await expect(block.getByText(/Partner$/).first()).toBeVisible();
  // And each card carries its own Sponsored marker for assistive tech.
  await expect(block.getByText("Sponsored placement.", { exact: false })).toHaveCount(3);
});

test("directory search and sort still control the organic results", async ({ page }) => {
  await page.goto("/business");
  await expect(page.getByTestId("directory-sponsored")).toBeVisible({ timeout: 15000 });

  const counter = page.getByText(/Showing/);
  const before = await counter.innerText();

  await page.getByPlaceholder(/search/i).first().fill("zzzz-no-such-business");
  await expect(page.getByText(/No match for/)).toBeVisible();
  // A failed search must not surface paid placements as if they were results.
  await expect(page.getByTestId("directory-sponsored")).toHaveCount(0);

  await page.getByPlaceholder(/search/i).first().fill("");
  await expect(counter).toHaveText(before);

  // Sorting is reader-controlled and must not be overridden by sponsorship.
  await page.getByLabel("Sort").selectOption("name");
  const names = (await page.getByTestId("directory-results").locator("article h3 a").allInnerTexts())
    .map((n) => n.trim())
    .filter(Boolean);
  expect(names.length).toBeGreaterThan(1);
  const sorted = [...names].sort((a, b) => a.localeCompare(b));
  expect(names).toEqual(sorted);
});
