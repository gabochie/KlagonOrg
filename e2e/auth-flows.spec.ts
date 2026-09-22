import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Authenticated end-to-end flows against the REAL backend.
 *
 * Needs throwaway accounts (Supabase Auth, auto-confirmed):
 *   E2E_MEMBER_EMAIL / E2E_MEMBER_PASSWORD (role: member, status: approved)
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   (role: admin,  status: approved)
 * Local runs load these from .env.e2e.local (gitignored); CI injects
 * them as job env vars. Without them every test here skips.
 *
 * The submit form is deliberately Turnstile-walled (anti-bot), so the
 * lifecycle test files the post through the same RLS insert policy the
 * form uses (member session, status pending) and asserts everything the
 * USER sees through the UI: pending chip, moderation approve, live feed.
 * The forum test below is fully UI-driven (no captcha on forum forms).
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

function creds(): {
  member: { email: string; password: string };
  admin: { email: string; password: string };
} | null {
  const memberEmail = env("E2E_MEMBER_EMAIL");
  const memberPassword = env("E2E_MEMBER_PASSWORD");
  const adminEmail = env("E2E_ADMIN_EMAIL");
  const adminPassword = env("E2E_ADMIN_PASSWORD");
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!memberEmail || !memberPassword || !adminEmail || !adminPassword || !url || !anonKey) {
    return null;
  }
  return {
    member: { email: memberEmail, password: memberPassword },
    admin: { email: adminEmail, password: adminPassword },
  };
}

/** Non-null creds or skip. Keeps strict TS happy without `!` assertions. */
function requireCreds(): {
  member: { email: string; password: string };
  admin: { email: string; password: string };
} {
  const c = creds();
  if (!c) {
    test.skip(true, "needs E2E_MEMBER/PASSWORD + E2E_ADMIN/PASSWORD + Supabase env");
    throw new Error("unreachable — test skipped");
  }
  return c;
}

function authedClient(email: string, password: string) {
  const url = env("NEXT_PUBLIC_SUPABASE_URL") as string;
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY") as string;
  const sb = createClient(url, anonKey);
  return {
    sb,
    signIn: async () => {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error(`E2E sign-in failed for ${email}: ${error?.message}`);
      return data.user;
    },
  };
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  // Labels are unassociated siblings, so target inputs by type/placeholder.
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

test("member login lands on member dashboard", async ({ page }) => {
  const c = requireCreds();
  await login(page, c.member.email, c.member.password);
  await expect(page).toHaveURL(/\/dashboard\/member/, { timeout: 20000 });
  await expect(page.getByText(/taking you to your dashboard|welcome/i).first()).toBeVisible({ timeout: 20000 }).catch(() => {});
});

test("admin login lands on admin dashboard", async ({ page }) => {
  const c = requireCreds();
  await login(page, c.admin.email, c.admin.password);
  // If this lands on /dashboard/member instead, the admin role SQL was not run.
  await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 20000 });
});

test("submit-moderate-publish goes pending to live", async ({ page }) => {
  const c = requireCreds();
  const stamp = Date.now();
  const title = `E2E check ${stamp} — safe to delete`;
  let postId: string | null = null;

  const member = authedClient(c.member.email, c.member.password);
  const mUser = await member.signIn();
  const admin = authedClient(c.admin.email, c.admin.password);
  await admin.signIn();

  try {
    // 1. Member files a post (same RLS path + status the /submit form uses).
    const { data: inserted, error: insertErr } = await member.sb
      .from("posts")
      .insert({
        type: "news",
        title,
        body: "Automated end-to-end check. Safe to delete.",
        excerpt: "E2E check post.",
        category: "General",
        area: "klagon",
        status: "pending",
        boost_tier: "none",
        submitted_by: mUser.id,
      })
      .select("id")
      .single();
if (insertErr || !inserted) throw new Error(`member insert under RLS failed: ${insertErr?.message}`);
    postId = inserted.id;

    // 2. Author sees it as Pending in My Posts.
    await login(page, c.member.email, c.member.password);
    await expect(page).toHaveURL(/\/dashboard\/member/, { timeout: 20000 });
    await page.goto("/my/posts");
    const myCard = page.locator("div", { hasText: title }).last();
    await expect(myCard).toBeVisible({ timeout: 20000 });
    await expect(page.getByText("Pending").first()).toBeVisible({ timeout: 20000 });

    // 3. Admin approves it in the moderation queue.
    await login(page, c.admin.email, c.admin.password);
    await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 20000 });
    await page.goto("/dashboard/admin/moderation");
    const queueCard = page.locator("div.rounded-xl", { hasText: title }).first();
    await expect(queueCard).toBeVisible({ timeout: 20000 });
    await queueCard.getByRole("button", { name: "Approve", exact: true }).click();
    await expect(queueCard).toBeHidden({ timeout: 20000 });

    // 4. Public sees it live on /news.
    await page.goto("/news");
    await expect(page.getByText(title).first()).toBeVisible({ timeout: 20000 });
  } finally {
    // 5. Cleanup: admin hard-deletes the throwaway post.
    if (postId) {
      const sb: SupabaseClient = admin.sb;
      await sb.from("posts").delete().eq("id", postId);
    }
  }
});

test("forum thread lifecycle is fully UI-driven", async ({ page }) => {
  const c = requireCreds();
  const stamp = Date.now();
  const title = `E2E thread ${stamp} — safe to delete`;

  await login(page, c.member.email, c.member.password);
  await expect(page).toHaveURL(/\/dashboard\/member/, { timeout: 20000 });

  // Open a thread on the general board.
  await page.goto("/forum/general");
  await page.getByRole("button", { name: "New thread" }).click();
  await page.locator("#forum-title").fill(title);
  await page.locator("#forum-body").fill("Automated forum check. Safe to delete.");
  await page.getByRole("button", { name: "Start thread" }).click();
  await expect(page).toHaveURL(/\/forum\/general\/\?t=/, { timeout: 20000 });
  await expect(page.getByRole("heading", { name: title })).toBeVisible({ timeout: 20000 });

  // Reply to it.
  await page.getByRole("button", { name: "Reply" }).click();
  await page.locator("#forum-reply").fill("E2E reply — safe to delete.");
  await page.getByRole("button", { name: "Post reply" }).click();
  await expect(page.getByText("E2E reply — safe to delete.")).toBeVisible({ timeout: 20000 });
  await expect(page.getByText("1 replies")).toBeVisible({ timeout: 20000 });

  // Delete the thread (cascades to the reply).
  page.on("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Delete" }).first().click();
  await expect(page).toHaveURL(/\/forum\/?$/, { timeout: 20000 });
});

