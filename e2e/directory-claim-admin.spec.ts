import { test, expect, type Page } from "@playwright/test";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The staff end of an owner claim on a /business directory listing, plus the
 * privacy boundary around the claimant's contact details.
 *
 * Two things are asserted here that nothing else covers:
 *
 * 1. A claim can actually be decided. Claims used to have no admin surface at
 *    all — the public form filed a row and nothing in the product could ever
 *    move it past "pending", so the verified badge was unreachable. Worse, an
 *    undecided claim blocks any new claim on that listing
 *    (directory_claims_active_business_key allows one non-rejected row per
 *    business_id), so a real owner could be locked out indefinitely.
 *
 * 2. The claimant's name and phone are NOT publicly readable. Before the
 *    lockdown, directory_claims_read_all was `for select using (true)` and the
 *    anon key ships in the client bundle, so anyone could dump the phone
 *    numbers of people trying to claim their business. The public badge read is
 *    now limited to (business_id, status) by column grant, with staff reading
 *    the full row through an is_admin()-gated SECURITY DEFINER function.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

const URL = env("NEXT_PUBLIC_SUPABASE_URL");
const ANON = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const ADMIN_EMAIL = env("E2E_ADMIN_EMAIL");
const ADMIN_PASSWORD = env("E2E_ADMIN_PASSWORD");
const MEMBER_EMAIL = env("E2E_MEMBER_EMAIL");
const MEMBER_PASSWORD = env("E2E_MEMBER_PASSWORD");

async function adminClient(): Promise<SupabaseClient> {
  const c = createClient(URL as string, ANON as string);
  const { error } = await c.auth.signInWithPassword({
    email: ADMIN_EMAIL as string,
    password: ADMIN_PASSWORD as string,
  });
  if (error) throw new Error(`admin sign-in failed: ${error.message}`);
  return c;
}

async function memberClient(): Promise<SupabaseClient> {
  const c = createClient(URL as string, ANON as string);
  const { error } = await c.auth.signInWithPassword({
    email: MEMBER_EMAIL as string,
    password: MEMBER_PASSWORD as string,
  });
  if (error) throw new Error(`member sign-in failed: ${error.message}`);
  return c;
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30000 });
}

/**
 * Remove a claim row as staff.
 *
 * Deliberately goes through admin_delete_directory_claim() rather than
 * `.from("directory_claims").delete()`. PostgREST returns the deleted row by
 * default, so a direct DELETE needs SELECT on every column, and the PII lockdown
 * removed exactly those. Cleanup that silently stops working is how 17 leftover
 * claim rows once filled the review queue and locked 17 real businesses out of
 * claiming their own listing, so this route is the only one that still works.
 */
async function deleteClaim(admin: SupabaseClient, id: string): Promise<void> {
  const { error } = await admin.rpc("admin_delete_directory_claim", { p_id: id });
  if (error) throw new Error(`claim delete failed for ${id}: ${error.message}`);
}

/** Every claim row matching a business_id, resolved to ids via the staff RPC. */
async function claimIdsFor(admin: SupabaseClient, bid: string): Promise<string[]> {
  const { data, error } = await admin.rpc("admin_directory_claims");
  if (error) throw new Error(`admin_directory_claims failed: ${error.message}`);
  return ((data ?? []) as { id: string; business_id: string }[])
    .filter((r) => r.business_id === bid)
    .map((r) => r.id);
}

const stamp = () => Date.now();

/**
 * Pick a real directory listing that nobody has claimed.
 *
 * Needed because the "does the public page actually flip to Claimed" assertion
 * has to run against a genuine /directory/<slug> page. The directory is a static
 * export generated from src/data/business-directory.json with
 * `dynamicParams = false`, so a made-up business_id has no page to visit and the
 * assertion would be theatre.
 *
 * The claim panel reads its state in the browser from the live table, so a page
 * built before the decision still reflects it. No rebuild needed.
 *
 * Scans from the end of the list: e2e/directory-claim.spec.ts takes the first
 * free listing it finds in DOM order, and two specs claiming the same business
 * concurrently would corrupt each other's state.
 */
function pickFreeListing(anon: SupabaseClient): Promise<{ id: string; slug: string; name: string }> {
  return (async () => {
    const { data: existing, error } = await anon.from("directory_claims").select("business_id, status");
    if (error) throw new Error(`could not read existing claims: ${error.message}`);
    // A rejected row does not block a new claim; pending and approved do.
    const blocked = new Set(
      (existing ?? []).filter((r) => r.status !== "rejected").map((r) => r.business_id as string),
    );
    const snapshot = JSON.parse(
      readFileSync(path.join(process.cwd(), "src", "data", "business-directory.json"), "utf8"),
    ) as { businesses: { id: string; slug: string; name: string }[] };
    for (let i = snapshot.businesses.length - 1; i >= 0; i -= 1) {
      const b = snapshot.businesses[i];
      if (!blocked.has(b.id)) return b;
    }
    throw new Error("every listing already has an active claim; cannot pick a free one");
  })();
}

/** Listing the test claims. Chosen per run so repeated runs never collide. */
let businessId = "";
let claimant = "";

test.describe("directory claim review", () => {
  test.beforeAll(() => {
    if (!URL || !ANON || !ADMIN_EMAIL || !ADMIN_PASSWORD || !MEMBER_EMAIL || !MEMBER_PASSWORD) {
      test.skip(true, "needs Supabase env and E2E member+admin creds");
      throw new Error("unreachable — test skipped");
    }
  });

  test.afterAll(async () => {
    if (!businessId) return;
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      throw new Error(`claim row for ${businessId} (${claimant}) needs deleting manually: no E2E admin creds`);
    }
    const admin = await adminClient();
    for (const id of await claimIdsFor(admin, businessId)) {
      await deleteClaim(admin, id);
    }
  });

  test("staff can see and approve a claim", async ({ page }) => {
    const anon = createClient(URL as string, ANON as string);
    const admin = await adminClient();
    const s = stamp();
    businessId = `E2E-CLAIM-${s}`;
    claimant = `E2E Claimant ${s}`;

    // Seeded without `.select()`. PostgREST returns the inserted row, which
    // needs SELECT on every column, and the PII lockdown left `authenticated`
    // and `anon` with only (business_id, status). A plain insert is all a real
    // visitor can do, so the test should not do more than the product can.
    const ins = await anon.from("directory_claims").insert({
      business_id: businessId,
      business_name: "E2E Review Bakery",
      area: "Klagon",
      claimant_name: claimant,
      claimant_phone: "0240001122",
      status: "pending",
    });
    if (ins.error) throw new Error(`seed insert failed: ${ins.error.message}`);

    // The RPC is how staff read claims now. If it is missing, the migration has
    // not been applied and there is nothing to review.
    const { data: viaRpc, error: rpcErr } = await admin.rpc("admin_directory_claims");
    if (rpcErr) {
      test.skip(
        true,
        `admin_directory_claims missing (${rpcErr.message}) — apply 20260930030000_directory_claims_pii.sql`,
      );
      return;
    }
    expect(
      ((viaRpc ?? []) as { business_id: string }[]).some((r) => r.business_id === businessId),
      "pending claim is visible to staff via the gated RPC",
    ).toBe(true);

    // And the same data is NOT reachable without admin rights.
    const { data: viaTable, error: tableErr } = await anon
      .from("directory_claims")
      .select("claimant_name, claimant_phone")
      .eq("business_id", businessId);
    if (tableErr) {
      // PostgREST rejects the request outright: also acceptable.
      expect(tableErr.message).toBeTruthy();
    } else {
      expect(viaTable ?? [], "anon must not read claimant PII").toHaveLength(0);
    }

    await login(page, ADMIN_EMAIL as string, ADMIN_PASSWORD as string);
    await page.goto("/dashboard/admin/directory-claims");

    const card = page.getByTestId("directory-claim").filter({ hasText: businessId });
    await expect(card, "claim appears in the staff queue").toBeVisible({ timeout: 20000 });
    await expect(card).toContainText(claimant);
    await expect(card).toContainText("0240001122");

    // Verification happens in WhatsApp; the link should open a thread with the
    // claimant and name the listing.
    const verify = card.getByTestId("claim-verify-link");
    await expect(verify, "claimant phone links into a WhatsApp thread").toBeVisible();
    const href = await verify.getAttribute("href");
    expect(href).toContain("wa.me/233240001122");
    expect(decodeURIComponent(href ?? "")).toContain(businessId);

    await card.getByTestId("claim-approve").click();

    // Cleared from the actionable queue, and durably decided in the database.
    await expect(
      page.getByTestId("directory-claim").filter({ hasText: businessId }),
      "approved claim leaves the actionable queue",
    ).toHaveCount(0);
    const { data: decided, error: readErr } = await admin
      .from("directory_claims")
      .select("status")
      .eq("business_id", businessId)
      .single();
    if (readErr) throw new Error(`post-approve read failed: ${readErr.message}`);
    expect(decided.status, "approve marks the claim approved").toBe("approved");
  });

  test("approving a real claim flips its public listing page to Claimed", async ({ page }) => {
    const anon = createClient(URL as string, ANON as string);
    const admin = await adminClient();
    const listing = await pickFreeListing(anon);
    const s = stamp();

    const ins = await anon.from("directory_claims").insert({
      business_id: listing.id,
      business_name: listing.name,
      area: "Klagon",
      claimant_name: `E2E Public Page ${s}`,
      claimant_phone: "0240007788",
      status: "pending",
    });
    if (ins.error) throw new Error(`seed insert failed: ${ins.error.message}`);
    const [claimId] = await claimIdsFor(admin, listing.id);
    if (!claimId) throw new Error(`seed row for ${listing.id} is not visible to staff`);

    try {
      // Before: the owner can still start a claim.
      await page.goto(`/directory/${listing.slug}/`);
      await expect(
        page.getByTestId("claim-start"),
        "an unclaimed listing still invites a claim",
      ).toBeVisible({ timeout: 20000 });

      await login(page, ADMIN_EMAIL as string, ADMIN_PASSWORD as string);
      await page.goto("/dashboard/admin/directory-claims");
      const card = page.getByTestId("directory-claim").filter({ hasText: listing.id });
      await expect(card, "the real listing's claim is in the staff queue").toBeVisible({
        timeout: 20000,
      });
      await card.getByTestId("claim-approve").click();
      await expect(card, "approved claim leaves the queue").toHaveCount(0);

      // The actual gap this closes: the whole point of approving is that the
      // owner's page changes. Asserted on the real page, as a logged-out
      // visitor would see it, after a fresh load.
      await page.context().clearCookies();
      await page.goto(`/directory/${listing.slug}/`);
      await expect(
        page.getByText("This listing is verified to its owner."),
        "approved listing shows the verified-owner panel",
      ).toBeVisible({ timeout: 20000 });
      await expect(page.getByText("Claimed", { exact: true })).toBeVisible();
      await expect(
        page.getByTestId("claim-start"),
        "a claimed listing must not invite another claim",
      ).toHaveCount(0);
      await expect(
        page.getByText("A claim is in progress."),
        "a decided claim must not still read as under review",
      ).toHaveCount(0);

      // And the badge is driven by the database, not baked into the build:
      // reopening the same claim must take the page back out of "Claimed".
      await login(page, ADMIN_EMAIL as string, ADMIN_PASSWORD as string);
      await page.goto("/dashboard/admin/directory-claims");
      await page.getByTestId("directory-claims-decided-toggle").click();
      const decidedRow = page.locator(`[data-testid="directory-claim-decided"][data-claim-id="${claimId}"]`);
      await expect(decidedRow, "the decided claim is listed for staff").toBeVisible({
        timeout: 20000,
      });
      await decidedRow.getByTestId("claim-reopen").click();
      await expect(decidedRow, "reopened claim leaves the decided list").toHaveCount(0);

      await page.context().clearCookies();
      await page.goto(`/directory/${listing.slug}/`);
      await expect(
        page.getByText("A claim is in progress."),
        "a reopened claim reads as under review, not claimed",
      ).toBeVisible({ timeout: 20000 });
      await expect(page.getByText("This listing is verified to its owner.")).toHaveCount(0);

      // Reject it, and the real owner gets their claim button back.
      await login(page, ADMIN_EMAIL as string, ADMIN_PASSWORD as string);
      await page.goto("/dashboard/admin/directory-claims");
      await page
        .getByTestId("directory-claim")
        .filter({ hasText: listing.id })
        .getByTestId("claim-reject")
        .click();
      await expect(
        page.getByTestId("directory-claim").filter({ hasText: listing.id }),
        "rejected claim leaves the actionable queue",
      ).toHaveCount(0);

      await page.context().clearCookies();
      await page.goto(`/directory/${listing.slug}/`);
      await expect(
        page.getByTestId("claim-start"),
        "rejecting frees the real listing for its owner again",
      ).toBeVisible({ timeout: 20000 });
      await expect(page.getByText("This listing is verified to its owner.")).toHaveCount(0);
    } finally {
      // Never leave a real business sitting in a decided state because a test
      // run was interrupted.
      await deleteClaim(admin, claimId);
    }
  });

  test("reject frees the listing for a fresh claim", async ({ page }) => {
    const anon = createClient(URL as string, ANON as string);
    const admin = await adminClient();
    const s = stamp();
    const bid = `E2E-REJECT-${s}`;

    const first = await anon.from("directory_claims").insert({
      business_id: bid,
      business_name: "E2E Reject Shop",
      area: "Klagon",
      claimant_name: `E2E Reject Claimant ${s}`,
      claimant_phone: "0240003344",
      status: "pending",
    });
    if (first.error) throw new Error(`seed insert failed: ${first.error.message}`);

    try {
      await login(page, ADMIN_EMAIL as string, ADMIN_PASSWORD as string);
      await page.goto("/dashboard/admin/directory-claims");
      const card = page.getByTestId("directory-claim").filter({ hasText: bid });
      await expect(card).toBeVisible({ timeout: 20000 });
      await card.getByTestId("claim-reject").click();
      await expect(
        page.getByTestId("directory-claim").filter({ hasText: bid }),
        "rejected claim leaves the actionable queue",
      ).toHaveCount(0);

      const { data: after, error: afterErr } = await admin
        .from("directory_claims")
        .select("status")
        .eq("business_id", bid)
        .single();
      if (afterErr) throw new Error(`post-reject read failed: ${afterErr.message}`);
      expect(after.status).toBe("rejected");

      // The point of rejecting: the unique index only covers non-rejected rows,
      // so the owner can try again instead of being locked out forever.
      // A rejected claim must not block a new claim.
      const retry = await anon.from("directory_claims").insert({
        business_id: bid,
        business_name: "E2E Reject Shop",
        area: "Klagon",
        claimant_name: `E2E Reject Claimant ${s} retry`,
        claimant_phone: "0240003344",
        status: "pending",
      });
      expect(retry.error, "a rejected claim must not block a new claim").toBeNull();

      // Two rows for this business_id now: the rejected one and the retry.
      // Resolve ids as staff, since a client holding only (business_id, status)
      // cannot read id back after inserting.
      const ids = await claimIdsFor(admin, bid);
      expect(ids, "rejected row is kept and the retry is a second row").toHaveLength(2);
      for (const id of ids) {
        await deleteClaim(admin, id);
      }
    } finally {
      for (const id of await claimIdsFor(admin, bid)) {
        await deleteClaim(admin, id);
      }
    }
  });

  test("a signed-in member cannot approve a claim or read claimant PII", async () => {
    const anon = createClient(URL as string, ANON as string);
    const member = await memberClient();
    const s = stamp();
    const bid = `E2E-MEMBER-${s}`;

    const ins = await anon.from("directory_claims").insert({
      business_id: bid,
      business_name: "E2E Member Shop",
      area: "Klagon",
      claimant_name: `E2E Member Claimant ${s}`,
      claimant_phone: "0240005566",
      status: "pending",
    });
    if (ins.error) throw new Error(`seed insert failed: ${ins.error.message}`);

    const admin = await adminClient();
    const [claimId] = await claimIdsFor(admin, bid);
    if (!claimId) throw new Error(`seed row for ${bid} is not visible to staff`);
    try {
      // A member must not be able to verify their own claim, or any claim.
      //
      // Filtered by business_id rather than id on purpose: `id` is not among
      // the two columns the lockdown lets a signed-in role read, so filtering
      // on it would fail on column privileges and the test would pass even if
      // RLS were wide open. business_id is readable, so this exercises the
      // is_admin() policy and nothing else.
      const { data: approved, error: updErr } = await member
        .from("directory_claims")
        .update({ status: "approved" })
        .eq("business_id", bid)
        .select("status");
      expect(updErr, "member update is rejected or affects no rows").toBeTruthy();
      expect(approved ?? [], "member must not be able to approve a claim").toHaveLength(0);

      // Nor read the contact details of other claimants.
      const { data: leaked, error: leakErr } = await member
        .from("directory_claims")
        .select("claimant_name, claimant_phone")
        .eq("business_id", bid);
      if (leakErr) {
        expect(leakErr.message).toBeTruthy();
      } else {
        expect(leaked ?? [], "member must not read claimant PII").toHaveLength(0);
      }

      // The gated RPC must refuse a non-admin outright, not return empty.
      const { data: rpcData, error: rpcErr } = await member.rpc("admin_directory_claims");
      expect(rpcErr, "admin_directory_claims must refuse non-admins").toBeTruthy();
      expect(rpcData ?? []).toHaveLength(0);

      // Nor delete a claim out from under staff.
      const { error: delErr } = await member.rpc("admin_delete_directory_claim", {
        p_id: claimId,
      });
      expect(delErr, "admin_delete_directory_claim must refuse non-admins").toBeTruthy();

      // Still pending, untouched.
      const { data: state } = await admin
        .from("directory_claims")
        .select("status")
        .eq("business_id", bid)
        .single();
      expect(state?.status, "claim was not approved by the member").toBe("pending");
    } finally {
      await deleteClaim(admin, claimId);
    }
  });
});
