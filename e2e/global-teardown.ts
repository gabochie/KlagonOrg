import type { FullConfig } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Best-effort sweep for test rows left behind by an interrupted run.
 *
 * Every spec that writes cleans up in afterAll, but afterAll does not run when
 * a worker is killed (Ctrl+C, a crashed run, a machine that sleeps). That
 * already happened once here: 17 leftover claim rows filled the staff review
 * queue and, because directory_claims has a partial unique index on
 * business_id where status <> 'rejected', 17 real Klagon businesses were
 * blocked from ever claiming their own listing. Five "E2E ... - safe to delete"
 * posts were also left publicly visible on the live site.
 *
 * So this removes anything matching the test markers, and only that. The
 * patterns are anchored prefixes that no real editorial content uses — the
 * database holds 30 genuine posts, none of which start with "E2E " or "Diag ".
 * Never broaden these without checking that table again.
 *
 * Failures here are reported but never fail the run: cleanup is not the
 * product under test, and a missing E2E admin credential should not turn a
 * green suite red.
 */
const CLAIMANT_PREFIXES = ["E2E %", "Diag %"];
const POST_TITLE_PREFIX = "E2E %";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export default async function globalTeardown(_config: FullConfig): Promise<void> {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const email = env("E2E_ADMIN_EMAIL");
  const password = env("E2E_ADMIN_PASSWORD");
  if (!url || !anonKey) return;
  if (!email || !password) {
    console.log("[e2e] teardown: no E2E admin creds, skipping sweep.");
    return;
  }

  try {
    const sb = createClient(url, anonKey);
    const { error: signIn } = await sb.auth.signInWithPassword({ email, password });
    if (signIn) throw new Error(`admin sign-in failed: ${signIn.message}`);

    let removed = 0;

    // Claims are listed and deleted through the admin-gated RPC pair, never
    // with `.from("directory_claims").delete().like(...)`.
    //
    // Two independent reasons. The PII lockdown revoked SELECT on
    // claimant_name, and Postgres requires SELECT on every column named in a
    // DELETE's WHERE clause, so the filter alone is now forbidden. And
    // PostgREST returns the deleted row by default, so a table DELETE needs
    // SELECT on every column regardless. This sweep is the safety net for the
    // exact failure it hit before — it must not be the thing that breaks.
    //
    // The pattern match happens in JS on data the staff RPC already returns, so
    // no LIKE and no pattern-matching SQL is exposed to the database.
    const { data: claims, error: claimsErr } = await sb.rpc("admin_directory_claims");
    if (claimsErr) throw new Error(`claim list failed: ${claimsErr.message}`);

    const stale = ((claims ?? []) as { id: string; claimant_name: string }[]).filter((c) =>
      CLAIMANT_PREFIXES.some((p) => c.claimant_name.startsWith(p.replace("%", ""))),
    );
    for (const c of stale) {
      const { error: delErr } = await sb.rpc("admin_delete_directory_claim", { p_id: c.id });
      if (delErr) throw new Error(`claim delete failed for ${c.id}: ${delErr.message}`);
      removed += 1;
    }

    const { count: posts, error: postErr } = await sb
      .from("posts")
      .delete({ count: "exact" })
      .like("title", POST_TITLE_PREFIX);
    if (postErr) throw new Error(`post sweep: ${postErr.message}`);
    removed += posts ?? 0;

    if (removed > 0) {
      console.log(`[e2e] teardown: removed ${removed} leftover test row(s) — a previous run was interrupted.`);
    } else {
      console.log("[e2e] teardown: no leftover test rows.");
    }
  } catch (err) {
    console.log(`[e2e] teardown sweep failed: ${(err as Error).message}`);
  }
}
