import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The manual boost loop, end to end:
 *   seller requests on /my/posts -> staff sees it in /dashboard/admin/boosts
 *   -> staff applies it -> the post comes back actually boosted.
 *
 * This is the path that was previously impossible: purchase_boost is locked to
 * service_role, so without admin_apply_boost a paid boost could never be
 * applied and the money would be taken with nothing to show for it.
 *
 * The admin_apply_boost RPC only exists once its migration is applied, so this
 * spec skips (rather than fails) when the function is missing.
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
  await expect(page).toHaveURL(/\/dashboard\/member|\/dashboard\/admin/, { timeout: 20000 });
}

type PostRow = {
  id: string;
  type: string;
  category: string | null;
  status: string;
  boost_tier: string | null;
  boost_until: string | null;
  boost_fee_ghs: number | null;
};

test.describe("boost fulfilment", () => {
  let admin: SupabaseClient;
  let postId: string | null = null;

  test.beforeAll(async () => {
    const c = requireCreds();
    admin = createClient(c.url, c.anonKey);
    const { error } = await admin.auth.signInWithPassword({
      email: c.adminEmail,
      password: c.adminPassword,
    });
    if (error) throw new Error(`admin sign-in failed: ${error.message}`);

    // Does the grant path exist yet?
    const { error: probe } = await admin.rpc("admin_apply_boost", { p_post_id: "00000000-0000-0000-0000-000000000000" });
    const missing =
      probe?.code === "42883" || /does not exist|not found|schema cache/i.test(probe?.message ?? "");
    if (missing) {
      test.skip(true, "admin_apply_boost migration not applied to this database yet");
    }
  });

  test.afterAll(async () => {
    if (postId) await admin.from("posts").delete().eq("id", postId);
  });

  async function readPost(id: string): Promise<PostRow> {
    const { data, error } = await admin
      .from("posts")
      .select("id, type, category, status, boost_tier, boost_until, boost_fee_ghs")
      .eq("id", id)
      .single();
    if (error || !data) throw new Error(`post read failed: ${error?.message}`);
    return data as PostRow;
  }

  test("a member cannot boost their own post, and staff can fulfil the request", async ({ page }) => {
    const c = requireCreds();

    // 1. Member creates and gets a listing approved.
    const member = createClient(c.url, c.anonKey);
    const { data: signed, error: sErr } = await member.auth.signInWithPassword({
      email: c.memberEmail,
      password: c.memberPassword,
    });
    if (sErr || !signed.user) throw new Error(`member sign-in failed: ${sErr?.message}`);

    const title = `E2E boost fulfil ${Date.now()} — safe to delete`;
    const { data: inserted, error: iErr } = await member
      .from("posts")
      .insert({
        type: "classified",
        title,
        body: "Automated boost fulfilment check. Safe to delete.",
        excerpt: "E2E boost fulfil.",
        category: "Properties",
        area: "klagon",
        status: "pending",
        boost_tier: "none",
        submitted_by: signed.user.id,
      })
      .select("id")
      .single();
    if (iErr || !inserted) throw new Error(`insert failed: ${iErr?.message}`);
    // Non-null local for the rest of the test; the outer postId is only the
    // afterAll cleanup handle, which may legitimately be null.
    const target: string = inserted.id;
    postId = target;

    const { error: aErr } = await admin
      .from("posts")
      .update({ status: "approved", published_at: new Date().toISOString(), rejected_reason: null })
      .eq("id", target);
    if (aErr) throw new Error(`approve failed: ${aErr.message}`);

    // 2. The revoked purchase_boost must stay unreachable from a member
    //    session. This is the whole reason the grant path had to be added.
    const { data: sneaky, error: sneakErr } = await member.rpc("purchase_boost", {
      p_post_id: target,
      p_tier: "premium",
    });
    if (!sneakErr) {
      expect(sneaky, "member must not be able to self-purchase a boost").toBe(false);
    } else {
      expect(sneakErr.message, "expected a permission error").toMatch(/permission|denied|not granted/i);
    }
    const afterSneak = await readPost(target);
    expect(afterSneak.boost_tier, "self-purchase attempt must not boost the post").toBe("none");
    expect(afterSneak.boost_until).toBeNull();

    // 3. Member requests the boost through the UI.
    await login(page, c.memberEmail, c.memberPassword);
    await page.goto("/my/posts");
    const card = page.locator(`[data-post-id="${target}"]`).first();
    await expect(card, "listing is listed for its owner").toBeVisible({ timeout: 20000 });
    await card.getByRole("button", { name: /Feature this listing/i }).click();
    await card.getByRole("button", { name: /Request this boost/i }).click();
    await expect(card.getByText(/Request received/i)).toBeVisible({ timeout: 20000 });

    // 4. Staff fulfil it from the admin queue.
    await login(page, c.adminEmail, c.adminPassword);
    await page.goto("/dashboard/admin/boosts");
    const queue = page.locator(`[data-post-id="${target}"]`).first();
    await expect(queue, "boost request reaches the staff queue").toBeVisible({ timeout: 20000 });
    // A Properties classified is the premium tier: 50 for 7 days.
    await expect(queue.getByText(/50 \/ 7d/)).toBeVisible();
    await queue.getByRole("button", { name: /Mark paid & apply boost/i }).click();
    await expect(queue.getByText(/Boost applied/i)).toBeVisible({ timeout: 20000 });

    // 5. The post is genuinely boosted, at the quoted price and duration.
    const boosted = await readPost(target);
    expect(boosted.boost_tier).toBe("premium");
    expect(Number(boosted.boost_fee_ghs)).toBe(50);
    const daysOut = (new Date(boosted.boost_until as string).getTime() - Date.now()) / 86_400_000;
    expect(daysOut).toBeGreaterThan(6.5);
    expect(daysOut).toBeLessThan(7.1);

    // 6. The owner sees the boosted state, and cannot buy a second one.
    await login(page, c.memberEmail, c.memberPassword);
    await page.goto("/my/posts");
    const ownCard = page.locator(`[data-post-id="${target}"]`).first();
    await expect(ownCard.getByText(/Featured until/i)).toBeVisible({ timeout: 20000 });
    await expect(ownCard.getByRole("button", { name: /Feature this listing/i })).toHaveCount(0);

    // 7. Re-applying is refused rather than silently extending the boost.
    const { data: again } = await admin.rpc("admin_apply_boost", { p_post_id: target });
    expect(again, "a live boost must not be stacked").toBe(false);
  });
});
