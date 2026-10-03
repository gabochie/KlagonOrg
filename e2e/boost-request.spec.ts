import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Paid boost checkout on /my/posts.
 *
 * Boosts are charged through the klagon-payments Worker and confirmed by the
 * Moolre callback, so the browser only ever names the listing. The risk this
 * guards against is a client-granted placement: the panel must quote the
 * server-derived price and must not apply a boost unless a real payment
 * cleared.
 *
 * The spec creates and approves its own throwaway post (the submit form is
 * Turnstile-walled) and deletes it afterwards, so it can never quietly skip
 * for lack of data. It stops short of a live charge — Turnstile stays unsolved
 * — so it never spends money or writes a payment row.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function requireCreds() {
  const memberEmail = env("E2E_MEMBER_EMAIL");
  const memberPassword = env("E2E_MEMBER_PASSWORD");
  const adminEmail = env("E2E_ADMIN_EMAIL");
  const adminPassword = env("E2E_ADMIN_PASSWORD");
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!memberEmail || !memberPassword || !adminEmail || !adminPassword || !url || !anonKey) {
    test.skip(true, "needs E2E member+admin creds and Supabase env");
    throw new Error("unreachable — test skipped");
  }
  return { memberEmail, memberPassword, adminEmail, adminPassword, url, anonKey };
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  // Wait for the post-login redirect: hitting a guarded route before the
  // session is persisted bounces straight back to /auth/login.
  await expect(page).toHaveURL(/\/dashboard\/member|\/dashboard\/admin/, { timeout: 20000 });
}

test.describe("boost request", () => {
  // A classified in the Properties vertical exercises the premium tier
  // (GH₵50 / 7 days); a news post exercises the standard tier (GH₵30 / 3 days).
  // Both are quoted from the same rule the purchase_boost RPC charges.
  let admin: SupabaseClient;
  let postIds: string[] = [];
  const titles: Record<string, string> = {};

  async function seed(
    label: string,
    shape: { type: string; category: string },
    status: "pending" | "approved",
  ): Promise<string> {
    const c = requireCreds();
    const member = createClient(c.url, c.anonKey);
    const { data: signed, error: sErr } = await member.auth.signInWithPassword({
      email: c.memberEmail,
      password: c.memberPassword,
    });
    if (sErr || !signed.user) throw new Error(`member sign-in failed: ${sErr?.message}`);

    const title = `E2E boost ${label} ${Date.now()} — safe to delete`;
    titles[label] = title;
    const { data, error } = await member
      .from("posts")
      .insert({
        type: shape.type,
        title,
        body: "Automated boost-request check. Safe to delete.",
        excerpt: "E2E boost check.",
        category: shape.category,
        area: "klagon",
        status: "pending",
        boost_tier: "none",
        submitted_by: signed.user.id,
      })
      .select("id")
      .single();
    if (error || !data) throw new Error(`member insert under RLS failed: ${error?.message}`);
    postIds.push(data.id);

    if (status === "approved") {
      // Same update the moderation queue's approvePost() performs.
      const { error: aErr } = await admin
        .from("posts")
        .update({ status: "approved", published_at: new Date().toISOString(), rejected_reason: null })
        .eq("id", data.id);
      if (aErr) throw new Error(`approve failed: ${aErr.message}`);
    }
    return data.id;
  }

  test.beforeAll(async () => {
    const c = requireCreds();
    admin = createClient(c.url, c.anonKey);
    const { error } = await admin.auth.signInWithPassword({
      email: c.adminEmail,
      password: c.adminPassword,
    });
    if (error) throw new Error(`admin sign-in failed: ${error.message}`);
  });

  test.afterAll(async () => {
    for (const id of postIds) {
      await admin.from("posts").delete().eq("id", id);
    }
  });

  test("a pending listing offers no boost, an approved one is quoted the server price", async ({ page }) => {
    const c = requireCreds();
    const pendingId = await seed("pending", { type: "news", category: "General" }, "pending");
    const premiumId = await seed("premium", { type: "classified", category: "Properties" }, "approved");
    const standardId = await seed("standard", { type: "news", category: "General" }, "approved");

    await login(page, c.memberEmail, c.memberPassword);
    await page.goto("/my/posts");
    await expect(page.locator('[data-testid="my-post-card"]').first()).toBeVisible({ timeout: 20000 });

    // A listing that is not live yet must not sell a boost that cannot run.
    const pendingCard = page.locator(`[data-post-id="${pendingId}"]`).first();
    await expect(pendingCard).toBeVisible({ timeout: 20000 });
    await expect(pendingCard.getByRole("button", { name: /Feature this listing/i })).toHaveCount(0);

    // Quoted prices must track boostPriceFor(), not a hardcoded string.
    const cases: [string, { fee: number; days: number }][] = [
      [premiumId, { fee: 50, days: 7 }],
      [standardId, { fee: 30, days: 3 }],
    ];
    for (const [id, want] of cases) {
      const card = page.locator(`[data-post-id="${id}"]`).first();
      await expect(card).toBeVisible({ timeout: 20000 });
      await card.getByRole("button", { name: /Feature this listing/i }).click();
      // Assert the two numbers rather than one literal sentence, so copy
      // tweaks do not break the price contract that actually matters.
      await expect(card.getByText(new RegExp(`for ${want.days} days`))).toBeVisible({ timeout: 20000 });
      await expect(
        card.getByRole("button", { name: new RegExp(`Pay GH.\\s*${want.fee}\\b`) }),
      ).toBeVisible({ timeout: 20000 });
      // Checkout copy must make clear the feature only lands after payment.
      await expect(card.getByText(/goes live once payment clears/i)).toBeVisible();
      await card.getByRole("button", { name: /Not now/i }).click();
      await expect(card.getByRole("button", { name: /Feature this listing/i })).toBeVisible();
    }
  });

  test("a placement can never be granted from the browser", async ({ page }) => {
    const c = requireCreds();
    const targetId = await seed("confirm", { type: "classified", category: "Properties" }, "approved");

    const member = createClient(c.url, c.anonKey);
    await member.auth.signInWithPassword({ email: c.memberEmail, password: c.memberPassword });

    await login(page, c.memberEmail, c.memberPassword);
    await page.goto("/my/posts");
    await expect(page.locator('[data-testid="my-post-card"]').first()).toBeVisible({ timeout: 20000 });

    const card = page.locator(`[data-post-id="${targetId}"]`).first();
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.getByRole("button", { name: /Feature this listing/i }).click();
    // The quoted fee is the server tier (premium GH₵50), not client-supplied.
    await expect(card.getByText(/Feature this listing for 7 days/i)).toBeVisible({ timeout: 20000 });

    // Without the human check the charge must not start: no payment row, no
    // boost. This is the client-grant path we care about.
    await card.getByRole("button", { name: /Pay GH/i }).click();
    await expect(card.getByText(/human check/i)).toBeVisible({ timeout: 20000 });

    const { count: payCount, error: payErr } = await member
      .from("boost_payments")
      .select("id", { count: "exact", head: true })
      .eq("post_id", targetId);
    if (payErr) throw new Error(`boost_payments read failed: ${payErr.message}`);
    expect(payCount ?? 0, "no payment row was written").toBe(0);

    const { data: after, error: aErr } = await member
      .from("posts")
      .select("boost_until, boost_tier")
      .eq("id", targetId)
      .single();
    if (aErr) throw new Error(`posts read failed: ${aErr.message}`);
    expect(after.boost_until, "the listing was not featured").toBeNull();
    expect(after.boost_tier).toBe("none");
  });

  test("a boost_quote for an ineligible listing returns no price", async () => {
    const c = requireCreds();
    // A pending listing is not live, so it cannot be sold a placement.
    const pendingId = await seed("noquote", { type: "news", category: "General" }, "pending");

    const member = createClient(c.url, c.anonKey);
    await member.auth.signInWithPassword({ email: c.memberEmail, password: c.memberPassword });
    const { data, error } = await member.rpc("boost_quote", { p_post_id: pendingId });
    if (error) throw new Error(`boost_quote failed: ${error.message}`);
    expect((data ?? []).length, "an unpublishable listing has no quote").toBe(0);
  });
});
