import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

test("diag: what happens after claim submit", async ({ page }) => {
  test.setTimeout(180000);
  const sb = createClient(URL, ANON);
  await page.addInitScript(() => {
    (window as unknown as { open: () => null }).open = () => null;
  });

  const { data: existing } = await sb.from("directory_claims").select("business_id, status");
  const taken = new Set((existing ?? []).filter((r) => r.status !== "rejected").map((r) => r.business_id as string));

  await page.goto("/business");
  const results = page.getByTestId("directory-results");
  await expect(results).toBeVisible({ timeout: 20000 });
  const hrefs = await results
    .locator("a[href^='/directory/']")
    .evaluateAll((els) => Array.from(new Set(els.map((e) => e.getAttribute("href")).filter(Boolean))) as string[]);

  for (const href of hrefs) {
    await page.goto(href);
    const start = page.getByTestId("claim-start");
    if ((await start.count()) === 0) continue;
    const id = (await page.getByTestId("claim-listing-id").innerText()).replace("Listing ID", "").split(".")[0].trim();
    if (taken.has(id)) continue;

    const stamp = Date.now();
    await start.click();
    // Mirror the real test: empty submit first (validation path).
    await page.getByTestId("claim-submit").click();
    await page.waitForTimeout(400);
    console.log(
      "DIAG after empty submit",
      JSON.stringify(
        await page.evaluate(() => ({
          form: !!document.querySelector('[data-testid="claim-form"]'),
          err: document.querySelector('[data-testid="claim-error"]')?.textContent ?? null,
        })),
      ),
    );
    await page.locator("#claim-name").fill(`Diag ${stamp}`);
    await page.locator("#claim-phone").fill(`027${String(stamp).slice(-7)}`);
    await page.getByTestId("claim-submit").click();

    // Sample the panel repeatedly so a pending->unclaimed flicker is visible.
    for (const wait of [300, 700, 1500, 3000, 6000]) {
      await page.waitForTimeout(wait);
      const state = await page.evaluate(() => {
        const el = document.querySelector('[data-testid="directory-results"]');
        const pending = Array.from(document.querySelectorAll("h2")).some((h) =>
          /claim is in progress/i.test(h.textContent || ""),
        );
        const verified = Array.from(document.querySelectorAll("h2")).some((h) =>
          /verified to its owner/i.test(h.textContent || ""),
        );
        const form = !!document.querySelector('[data-testid="claim-form"]');
        const err = document.querySelector('[data-testid="claim-error"]')?.textContent ?? null;
        const startBtn = !!document.querySelector('[data-testid="claim-start"]');
        return { pending, verified, form, err, startBtn, hasResults: !!el };
      });
      console.log(`DIAG t+${wait}ms`, JSON.stringify(state));
    }

    const { data: row } = await sb
      .from("directory_claims")
      .select("business_id, status")
      .eq("claimant_name", `Diag ${stamp}`)
      .limit(1);
    console.log("DIAG db row:", JSON.stringify(row));

    // Now reload and see what a fresh page load shows.
    await page.reload();
    await page.waitForTimeout(2500);
    const after = await page.evaluate(() => {
      const pending = Array.from(document.querySelectorAll("h2")).some((h) =>
        /claim is in progress/i.test(h.textContent || ""),
      );
      const startBtn = !!document.querySelector('[data-testid="claim-start"]');
      return { pending, startBtn };
    });
    console.log("DIAG after reload:", JSON.stringify(after));
    return;
  }
  console.log("DIAG no unclaimed listing found");
});
