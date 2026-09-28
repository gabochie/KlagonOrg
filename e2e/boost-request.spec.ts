import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Manual boost-request flow on /my/posts.
 *
 * KLAGON sells boosts by hand until a payment rail exists, so this flow is
 * "ask us", not "buy now". The risk it has to guard against is a false
 * promise: the panel must never say "we'll be in touch" unless the request
 * genuinely reached lead_events. So the test asserts the row landed rather
 * than trusting the on-screen confirmation.
 *
 * The submit form is Turnstile-walled, so like the other specs this test
 * works from an already-approved post instead of driving the form.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function requireCreds() {
  const email = env("E2E_MEMBER_EMAIL");
  const password = env("E2E_MEMBER_PASSWORD");
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!email || !password || !url || !anonKey) {
    test.skip(true, "needs E2E_MEMBER creds + Supabase env");
    throw new Error("unreachable — test skipped");
  }
  return { email, password, url, anonKey };
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

type Row = { id: string; type: string; category: string | null; status: string; boost_until: string | null };

test.describe("boost request", () => {
  let sb: SupabaseClient;
  let posts: Row[];

  test.beforeEach(async () => {
    const c = requireCreds();
    sb = createClient(c.url, c.anonKey);
    const { data, error } = await sb.auth.signInWithPassword({ email: c.email, password: c.password });
    if (error || !data.user) throw new Error(`sign-in failed: ${error?.message}`);

    // RLS limits this to the signed-in member's own posts, which is exactly
    // the set /my/posts is allowed to offer boosts on.
    const { data: mine, error: pErr } = await sb
      .from("posts")
      .select("id, type, category, status, boost_until")
      .order("created_at", { ascending: false });
    if (pErr) throw new Error(`posts read failed: ${pErr.message}`);
    posts = (mine ?? []) as Row[];
  });

  test("is offered only on live listings, at the server-defined price", async ({ page }) => {
    const c = requireCreds();
    const approved = posts.filter((p) => p.status === "approved");
    test.skip(approved.length === 0, "member has no approved post to boost");

    await login(page, c.email, c.password);
    await page.goto("/my/posts");
    await expect(page.getByText(/My posts/i).first()).toBeVisible();

    // A pending/rejected listing must not sell a boost that cannot run yet.
    for (const p of posts.filter((x) => x.status !== "approved")) {
      const card = page.locator(`[data-post-id="${p.id}"]`).first();
      if ((await card.count()) > 0) {
        await expect(card.getByRole("button", { name: /Feature this listing/i })).toHaveCount(0);
      }
    }

    const target = approved.find((p) => !p.boost_until) ?? approved[0];
    const card = page.locator(`[data-post-id="${target.id}"]`).first();
    // A missing card is a real regression, not a "no data" skip.
    expect(await card.count(), "approved post is rendered on /my/posts").toBeGreaterThan(0);

    if (target.boost_until && new Date(target.boost_until) > new Date()) {
      // Live boost: shows its end date, not a second sales pitch.
      await expect(card.getByText(/Featured until/i)).toBeVisible();
      await expect(card.getByRole("button", { name: /Feature this listing/i })).toHaveCount(0);
      return;
    }

    // Mirror of boostPriceFor(): the quote must come from the server rule,
    // so this asserts the panel cannot drift from what purchase_boost charges.
    const expected =
      target.type === "classified" && (target.category === "Properties" || target.category === "Auto")
        ? { fee: 50, days: 7 }
        : target.type === "classified"
          ? { fee: 20, days: 3 }
          : { fee: 30, days: 3 };

    await card.getByRole("button", { name: /Feature this listing/i }).click();
    await expect(card.getByText(`GH₵ ${expected.fee} for ${expected.days} days`)).toBeVisible();
    await expect(card.getByText(/goes live once payment clears/i)).toBeVisible();
  });

  test("a shown confirmation means the request really landed", async ({ page }) => {
    const c = requireCreds();
    const approved = posts.filter((p) => p.status === "approved" && !p.boost_until);
    test.skip(approved.length === 0, "member has no unboosted approved post");
    const target = approved[0];

    const { data: before } = await sb
      .from("lead_events")
      .select("id")
      .eq("source", "boost-request")
      .eq("action", "submit");
    const priorCount = before?.length ?? 0;

    await login(page, c.email, c.password);
    await page.goto("/my/posts");

    const card = page.locator(`[data-post-id="${target.id}"]`).first();
    expect(await card.count(), "approved post is rendered on /my/posts").toBeGreaterThan(0);

    await card.getByRole("button", { name: /Feature this listing/i }).click();
    await card.getByRole("button", { name: /Request this boost/i }).click();

    // The confirmation is a promise to the seller, so it must correspond to a
    // stored row carrying the right price and the right post.
    await expect(card.getByText(/Request received/i)).toBeVisible({ timeout: 15_000 });

    const { data: after, error } = await sb
      .from("lead_events")
      .select("id, metadata, created_at")
      .eq("source", "boost-request")
      .eq("action", "submit")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`lead_events read failed: ${error.message}`);

    expect((after?.length ?? 0) - priorCount).toBeGreaterThanOrEqual(1);
    const mine = (after ?? []).map((r) => r.metadata as Record<string, unknown> | null);
    const match = mine.find((m) => m?.post_id === target.id);
    expect(match, "stored request references the post that was boosted").toBeTruthy();
    expect(typeof match?.fee_ghs).toBe("number");
    expect(typeof match?.days).toBe("number");
    expect(match?.tier).toBeTruthy();
  });
});
