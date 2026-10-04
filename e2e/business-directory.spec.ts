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

test("directory renders a window of cards and loads the rest on demand", async ({ page }) => {
  await page.goto("/business");
  await expect(page.getByTestId("directory-sponsored")).toBeVisible({ timeout: 15000 });

  const results = page.getByTestId("directory-results").locator("article");

  // The full 740-business snapshot ships to the browser as a serialized prop and
  // every search/filter/sort runs over all of it, but it must not all be
  // rendered. This page once emitted 743 <article> elements and 3.5 MB of HTML.
  await expect(results).toHaveCount(24);

  // The counter reports how many businesses match, not how many are on screen,
  // so the reader is never told a truncated list is the whole directory.
  await expect(page.getByText(/Showing/)).toContainText("of");

  const loadMore = page.getByRole("button", { name: /Load more businesses/i });
  await expect(loadMore).toBeVisible();
  await expect(loadMore).toContainText("24 of");

  // Asking for more grows the list. The exact count afterwards depends on where
  // the reader ended up: reaching the end of the list also arms the sentinel,
  // so more can stream in behind the click. Assert growth, and assert the list
  // is still windowed rather than expanding to all 740 businesses.
  await loadMore.click();
  await expect.poll(() => results.count(), { timeout: 15000 }).toBeGreaterThan(24);
  expect(await results.count()).toBeLessThan(200);

  // A fresh search is a fresh result set: the window must reset rather than
  // leaving the reader deep into the previous ordering.
  await page.getByPlaceholder(/search/i).first().fill("zzzz-no-such-business");
  await expect(page.getByText(/No match for/)).toBeVisible();
  await page.getByPlaceholder(/search/i).first().fill("");
  await expect(results).toHaveCount(24);

  // The regression that matters most: windowing must not quietly turn search
  // into a search over the 24 rendered cards. This business is last by name and
  // has never been rendered, so it can only be found if the full 740-strong
  // snapshot really is on the client.
  await page.getByPlaceholder(/search/i).first().fill("Zion Grace");
  await expect(results).toHaveCount(1);
  await expect(results.locator("h3")).toContainText("Zion Grace Preparatory School");
});
