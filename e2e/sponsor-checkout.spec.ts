import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Self-serve sponsorship checkout on /sponsor.
 *
 * Sponsorships are charged through the klagon-payments Worker and confirmed by
 * the Moolre callback; the partner is then promoted by an admin from the paid
 * queue. The risk this guards against is a client-granted sponsorship: the page
 * must quote the server-derived monthly price, must keep the bespoke Strategic
 * tier off the checkout, and must not write an application unless the human
 * check passed.
 *
 * The spec stops short of a live charge — Turnstile stays unsolved — so it never
 * spends money or writes a payment row.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function requireCreds() {
  const adminEmail = env("E2E_ADMIN_EMAIL");
  const adminPassword = env("E2E_ADMIN_PASSWORD");
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!adminEmail || !adminPassword || !url || !anonKey) {
    test.skip(true, "needs E2E admin creds and Supabase env");
    throw new Error("unreachable — test skipped");
  }
  return { adminEmail, adminPassword, url, anonKey };
}

test.describe("sponsor checkout", () => {
  let admin: SupabaseClient | null = null;
  const marker = `E2E sponsor ${Date.now()} — safe to delete`;

  test("priced tiers quote the server price; Strategic stays bespoke", async ({ page }) => {
    await page.goto("/sponsor");

    // Default tier is Growth: the checkout quotes its monthly fee.
    await expect(page.getByRole("button", { name: /Pay GH. 2,000\/mo/ })).toBeVisible({
      timeout: 20000,
    });

    // Community is the cheapest self-serve tier.
    await page.getByRole("button", { name: /Community Partner/ }).click();
    await expect(page.getByRole("button", { name: /Pay GH. 500\/mo/ })).toBeVisible();

    // Digital is the largest self-serve tier.
    await page.getByRole("button", { name: /Digital Transformation Partner/ }).click();
    await expect(page.getByRole("button", { name: /Pay GH. 10,000\/mo/ })).toBeVisible();

    // Strategic is bespoke: no MoMo checkout, just the enquiry form.
    await page.getByRole("button", { name: /Strategic Partner/ }).click();
    await expect(page.getByRole("button", { name: /Submit Interest/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Pay GH/ })).toHaveCount(0);
  });

  test("no application is written without the human check", async ({ page }) => {
    const c = requireCreds();
    admin = createClient(c.url, c.anonKey);
    const { error } = await admin.auth.signInWithPassword({
      email: c.adminEmail,
      password: c.adminPassword,
    });
    if (error) throw new Error(`admin sign-in failed: ${error.message}`);

    await page.goto("/sponsor");
    await page.getByRole("button", { name: /Community Partner/ }).click();

    await page.locator("#sponsor-name").fill(marker);
    await page.locator("#sponsor-phone").fill("0244000000");
    await page.getByRole("button", { name: /Pay GH/i }).click();

    // Without the human check the charge must not start.
    await expect(page.getByText(/human check/i)).toBeVisible({ timeout: 20000 });

    const { count, error: readErr } = await admin
      .from("sponsor_applications")
      .select("id", { count: "exact", head: true })
      .eq("full_name", marker);
    if (readErr) throw new Error(`sponsor_applications read failed: ${readErr.message}`);
    expect(count ?? 0, "no application was written").toBe(0);
  });

  test.afterAll(async () => {
    if (!admin) return;
    await admin.from("sponsor_applications").delete().eq("full_name", marker);
  });
});
