import { test, expect } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Claiming a business listing from its own profile page.
 *
 * /business already filed a claim row as well as opening WhatsApp, but
 * /directory/[slug] only opened WhatsApp. Since the profile page is what ranks
 * in search and what people actually land on, most claims were invisible to
 * staff: nothing landed in directory_claims, so the panel never moved off
 * "unclaimed" and the review queue never saw them.
 *
 * This asserts the row is written with the details staff need to verify it.
 *
 * Cleanup is not optional. directory_claims has a partial unique index on
 * business_id where status <> 'rejected', so a leftover test row permanently
 * blocks a real Klagon business from claiming its own listing. An earlier
 * version of this spec deliberately left rows behind ("acceptable") and
 * 17 listings ended up locked out while the staff queue was nothing but test
 * data. So the row is deleted afterwards, and the deletion is verified.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

const URL = env("NEXT_PUBLIC_SUPABASE_URL");
const ANON = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const ADMIN_EMAIL = env("E2E_ADMIN_EMAIL");
const ADMIN_PASSWORD = env("E2E_ADMIN_PASSWORD");

/** Row the test created, so afterAll can remove exactly that and no more. */
let claimedBusinessId: string | null = null;
let claimant = "";

async function adminClient(): Promise<SupabaseClient> {
  const c = createClient(URL as string, ANON as string);
  const { error } = await c.auth.signInWithPassword({
    email: ADMIN_EMAIL as string,
    password: ADMIN_PASSWORD as string,
  });
  if (error) throw new Error(`admin sign-in failed, cannot clean up: ${error.message}`);
  return c;
}

test.describe("directory listing claim", () => {
  test.beforeAll(() => {
    if (!URL || !ANON) {
      test.skip(true, "needs Supabase env");
      throw new Error("unreachable — skipped");
    }
  });

  test.afterAll(async () => {
    if (!claimedBusinessId || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      // Without admin creds the row cannot be removed, and leaving it would
      // block this business for real. Say so loudly rather than exiting quietly.
      if (claimedBusinessId) {
        throw new Error(
          `claim row for ${claimedBusinessId} (${claimant}) needs deleting manually: E2E admin creds absent`,
        );
      }
      return;
    }
    const admin = await adminClient();
    const { error } = await admin
      .from("directory_claims")
      .delete()
      .eq("business_id", claimedBusinessId)
      .eq("claimant_name", claimant);
    if (error) {
      throw new Error(`claim cleanup failed for ${claimedBusinessId}: ${error.message}`);
    }
    claimedBusinessId = null;
  });

  test("files the claim so staff can see it, and locks the panel", async ({ page }) => {
    const sb = createClient(URL as string, ANON as string);
    const stamp = Date.now();
    claimant = `E2E Claimant ${stamp}`;

    // window.open is what hands the visitor to WhatsApp; stub it before any
    // script runs so the click never spawns a tab.
    await page.addInitScript(() => {
      (window as unknown as { open: () => null }).open = () => null;
    });

    // Anything not rejected already blocks a second claim via the table's
    // partial unique index. Claimed listings are skipped so this test keeps
    // exercising the insert on every run instead of degrading into a check
    // that the panel is merely locked.
    const { data: existing, error: readErr } = await sb.from("directory_claims").select("business_id, status");
    if (readErr) throw new Error(`could not read existing claims: ${readErr.message}`);
    const taken = new Set(
      (existing ?? []).filter((r) => r.status !== "rejected").map((r) => r.business_id as string),
    );

    await page.goto("/business");
    const results = page.getByTestId("directory-results");
    await expect(results).toBeVisible({ timeout: 20000 });

    const hrefs = await results
      .locator("a[href^='/directory/']")
      .evaluateAll((els) => Array.from(new Set(els.map((e) => e.getAttribute("href")).filter(Boolean))) as string[]);
    expect(hrefs, "directory entries link to a /directory/ profile").not.toHaveLength(0);

    for (const href of hrefs) {
      // The static export serves directory URLs with a trailing slash.
      await page.goto(href);
      await expect(page).toHaveURL(/\/directory\/[^/]+\/?$/, { timeout: 20000 });

      const start = page.getByTestId("claim-start");
      if ((await start.count()) === 0) continue; // server says claimed/under review

      const id = (await page.getByTestId("claim-listing-id").innerText())
        .replace("Listing ID", "")
        .split(".")[0]
        .trim();
      if (taken.has(id)) continue;
      claimedBusinessId = id;

      await start.click();
      await expect(page.getByTestId("claim-form")).toBeVisible();

      // Empty submit must not pretend to file anything. Scoped by testid
      // because Next.js's route announcer also carries role="alert".
      await page.getByTestId("claim-submit").click();
      await expect(page.getByTestId("claim-error")).toBeVisible();

      await page.locator("#claim-name").fill(claimant);
      await page.locator("#claim-phone").fill(`024${String(stamp).slice(-7)}`);
      await page.getByTestId("claim-submit").click();

      // The claim must genuinely be in the table staff read, with enough
      // detail to verify ownership. This is the assertion that would have
      // failed before: WhatsApp was opened and nothing was ever recorded.
      // Polled because the write is fired without blocking the UI transition.
      let row: { business_id: string; status: string; claimant_phone: string | null } | null = null;
      await expect
        .poll(
          async () => {
            const { data, error } = await sb
              .from("directory_claims")
              .select("business_id, status, claimant_phone")
              .eq("claimant_name", claimant)
              .order("created_at", { ascending: false })
              .limit(1);
            if (error) throw new Error(`claim read failed: ${error.message}`);
            row = data?.[0] ?? null;
            return row;
          },
          { timeout: 20000, message: "claim row was written for staff to review" },
        )
        .toBeTruthy();

      expect(row!.business_id, "claim is tied to the listing shown").toBe(id);
      expect(row!.status, "claims start pending for staff review").toBe("pending");
      expect(row!.claimant_phone, "staff get a number to verify against").toBeTruthy();

      // Reload rather than asserting in place: the claim lock is server-backed,
      // so a fresh load is the contract that actually matters. It also proves
      // the state was persisted, not just optimistically rendered, and that the
      // owner is no longer invited to file a duplicate claim.
      await page.reload();
      await expect(page.getByText(/A claim is in progress/i)).toBeVisible({ timeout: 20000 });
      await expect(page.getByTestId("claim-start")).toHaveCount(0);
      return;
    }

    throw new Error(`every directory listing on the first page is already claimed (${taken.size} claimed)`);
  });
});