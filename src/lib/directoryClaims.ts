"use client";

// ------------------------------------------------------------------
// Directory listing claims — the static /business directory (740
// listings) claimed by their owners.
//
// Anyone can start a claim (name + WhatsApp) which locks the listing
// as "pending". KlagonOrg staff verify in the WhatsApp thread and set
// status -> 'approved', which turns the public UI into a "Claimed"
// badge and removes the claim buttons. reject frees the slot.
// ------------------------------------------------------------------

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { Database } from "@/lib/database.types";
import { ORG_WA, ORG_PHONE_DISPLAY, waLink } from "@/lib/wa";

export { ORG_WA, ORG_PHONE_DISPLAY, waLink };

export type DirectoryClaimState = "unclaimed" | "pending" | "approved";

type ClaimRow = Database["public"]["Tables"]["directory_claims"]["Row"];

export interface DirectoryClaim {
  id: string;
  businessId: string;
  businessName: string | null;
  area: string | null;
  claimantName: string | null;
  claimantPhone: string | null;
  status: DirectoryClaimState;
  createdAt: string;
}

export interface ClaimResult {
  ok: boolean;
  error?: string;
}

/**
 * Turn a raw PostgREST message into something safe to render, keeping the real
 * one in the console.
 *
 * These strings reach business owners (submitting a claim) and staff (deciding
 * one), and PostgREST errors name the objects involved: the
 * `directory_claims` table, the `admin_directory_claims` RPC, and on a project
 * where a migration has not been applied, the migration filename itself. None
 * of that helps the person reading it, and on an admin surface it tells anyone
 * who reaches it exactly which database object is missing.
 *
 * The two cases worth a specific message are handled by the callers, which
 * know whether the failure was a duplicate claim or a missing schema.
 */
function safeClaimError(raw: unknown, fallback: string): string {
  console.error("[directory-claims]", raw);
  return fallback;
}

/**
 * The admin view of a claim. Deliberately not `extends DirectoryClaim`: the
 * public panel only ever needs pending/approved, while staff must be able to
 * tell a rejected claim apart from one that was never made.
 */
export type DirectoryClaimStatus = "pending" | "approved" | "rejected";

export interface AdminDirectoryClaim {
  id: string;
  businessId: string;
  businessName: string | null;
  area: string | null;
  claimantName: string | null;
  claimantPhone: string | null;
  status: DirectoryClaimStatus;
  createdAt: string;
}

const client = () => {
  if (!isSupabaseConfigured()) return null;
  return getBrowserClient();
};

function mapClaim(row: ClaimRow): DirectoryClaim {
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.business_name,
    area: row.area,
    claimantName: row.claimant_name,
    claimantPhone: row.claimant_phone,
    status: row.status === "approved" ? "approved" : row.status === "pending" ? "pending" : "unclaimed",
    createdAt: row.created_at,
  };
}

const chunk = <T,>(items: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
};

/**
 * Fetch the claim state for a set of business ids. Fails open: if Supabase
 * is not configured or the table is missing (migration not applied yet), we
 * return an empty map so the UI shows everything as unclaimed.
 */
export async function fetchDirectoryClaimMap(businessIds: string[]): Promise<Record<string, DirectoryClaimState>> {
  const map: Record<string, DirectoryClaimState> = {};
  const unique = Array.from(new Set(businessIds.filter(Boolean)));
  if (unique.length === 0) return map;
  const c = client();
  if (!c) return map;
  try {
    for (const batch of chunk(unique, 100)) {
      const { data, error } = await c
        .from("directory_claims")
        .select("business_id,status")
        .in("business_id", batch);
      if (error) continue;
      for (const row of data ?? []) {
        map[row.business_id] = row.status === "approved" ? "approved" : row.status === "pending" ? "pending" : "unclaimed";
      }
    }
  } catch {
    // fail-open
  }
  return map;
}

export async function fileDirectoryClaim(input: {
  businessId: string;
  businessName: string;
  area: string;
  claimantName: string;
  claimantPhone: string;
}): Promise<ClaimResult> {
  const c = client();
  if (!c) return { ok: false, error: "Claims are not wired to a backend yet." };
  const { error } = await c.from("directory_claims").insert({
    business_id: input.businessId,
    business_name: input.businessName,
    area: input.area,
    claimant_name: input.claimantName.trim(),
    claimant_phone: input.claimantPhone.trim(),
    status: "pending",
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "This listing has already been claimed or is under review." };
    }
    if (String(error.message).toLowerCase().includes("relation") || String(error.message).toLowerCase().includes("does not exist")) {
      console.error("[directory-claims] schema missing:", error.message);
      return { ok: false, error: undefined };
    }
    return { ok: false, error: safeClaimError(error, "That claim could not be submitted. Please try again.") };
  }
  return { ok: true };
}

// ------------------------------------------------------------------
// admin
//
// The table itself is no longer readable by anon or members: the public
// badge read is limited to (business_id, status) by column grant, and the
// claimant name/phone that staff need to verify ownership come from
// admin_directory_claims(), a SECURITY DEFINER function that raises unless
// is_admin(). So this queue cannot fall back to a plain select.
// ------------------------------------------------------------------

/** Unknown statuses fall back to "pending" so they stay visible in the queue. */
function toAdminClaim(row: ClaimRow): AdminDirectoryClaim {
  const status = row.status === "approved" || row.status === "rejected" ? row.status : "pending";
  return {
    id: row.id,
    businessId: row.business_id,
    businessName: row.business_name,
    area: row.area,
    claimantName: row.claimant_name,
    claimantPhone: row.claimant_phone,
    status,
    createdAt: row.created_at,
  };
}

/**
 * Every claim, pending first, for the staff review queue. Pending last would
 * be a real risk here: an unverified claim locks a listing out of new claims
 * via directory_claims_active_business_key until someone acts on it.
 */
export async function fetchAdminDirectoryClaims(): Promise<{ claims: AdminDirectoryClaim[]; error: string | null }> {
  const c = client();
  if (!c) return { claims: [], error: "Supabase is not configured." };
  const { data, error } = await c.rpc("admin_directory_claims");
  // The error is surfaced rather than swallowed: before the PII migration this
  // RPC does not exist, and an empty queue would read as "no claims waiting"
  // when in fact the queue could not load at all.
  //
  // Unlike the public submit path this returns the raw PostgREST message on
  // purpose. Its only caller is the admin queue, which logs it, derives a
  // support reference from it, and does not put it in the DOM. That is what
  // keeps an operator able to tell "RPC missing" from "permission denied"
  // without re-exposing the detail on screen.
  if (error) return { claims: [], error: error.message };
  return { claims: ((data ?? []) as ClaimRow[]).map(toAdminClaim), error: null };
}

/**
 * Move a claim from one status to another, verifying the write landed.
 *
 * Filtered by business_id and status, never by id. Postgres requires SELECT on
 * every column named in an UPDATE's WHERE clause, and the PII lockdown left
 * signed-in roles with only (business_id, status) — filtering by id fails with
 * "permission denied for table directory_claims" and no claim can ever be
 * decided. PostgREST also cannot return the updated row, so a failed update is
 * indistinguishable from a successful one without a follow-up read.
 *
 * business_id + status names exactly one row: the partial unique index
 * directory_claims_active_business_key allows only one non-rejected row per
 * business_id, and `from` pins the transition, so a decision another admin has
 * already made is a harmless no-op rather than a second write.
 *
 * `from` is also what makes a decision reversible. Without it a mis-click left a
 * real business permanently badged as verified with no way back but SQL.
 */
async function moveClaimStatus(
  businessId: string,
  next: "pending" | "approved" | "rejected",
  from: "pending" | "approved" | "rejected",
): Promise<ClaimResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };

  const { error } = await c
    .from("directory_claims")
    .update({ status: next, updated_at: new Date().toISOString() })
    .eq("business_id", businessId)
    .eq("status", from);
  if (error) {
    return { ok: false, error: safeClaimError(error, "That decision could not be saved. Please try again.") };
  }

  // Confirm the transition actually happened, since the update cannot return it.
  const { data, error: readErr } = await c.rpc("admin_directory_claims");
  if (readErr) {
    return { ok: false, error: safeClaimError(readErr, "That decision could not be confirmed. Please try again.") };
  }
  const isPending = ((data ?? []) as ClaimRow[]).some(
    (r) => r.business_id === businessId && r.status === "pending",
  );
  if (isPending !== (next === "pending")) {
    return { ok: false, error: "That change could not be saved. Someone may have decided this claim already." };
  }
  return { ok: true };
}

/** Approving shows the public "Claimed" badge and removes the claim buttons. */
export function approveDirectoryClaim(businessId: string): Promise<ClaimResult> {
  return moveClaimStatus(businessId, "approved", "pending");
}

/** Rejecting frees the listing for a fresh claim. */
export function rejectDirectoryClaim(businessId: string): Promise<ClaimResult> {
  return moveClaimStatus(businessId, "rejected", "pending");
}

/** Undo a decision, putting the claim back in the review queue. */
export function reopenDirectoryClaim(
  businessId: string,
  decided: "approved" | "rejected",
): Promise<ClaimResult> {
  return moveClaimStatus(businessId, "pending", decided);
}

/**
 * A prefilled WhatsApp message asking the claimant to prove they run the
 * business. Verification happens in that thread, so the staff queue links
 * straight into it rather than making staff retype the listing name.
 */
export function buildClaimVerificationMessage(claim: {
  businessName: string | null;
  businessId: string;
  claimantName: string | null;
}): string {
  const who = claim.claimantName ? ` ${claim.claimantName},` : "";
  return `Hi${who}! Thanks for claiming your KLAGON.org listing: ${claim.businessName ?? claim.businessId} (${claim.businessId}). To finish verification, please reply here with one detail that only the owner would know — for example your shop sign, your opening hours, or the owner full name on your business registration. Once confirmed we will add the verified badge to your page and add you to the Klagon business owners group.`;
}

// ------------------------------------------------------------------
// WhatsApp message builders
// ------------------------------------------------------------------
/** Sent to the KlagonOrg line when a visitor starts the claim flow. */
export function buildClaimMessage(b: {
  name: string;
  id: string;
  area: string;
  claimantName?: string;
  claimantPhone?: string;
}): string {
  const who = b.claimantName && b.claimantPhone ? ` My name is ${b.claimantName}, WhatsApp ${b.claimantPhone}.` : "";
  return `Hi KlagonOrg! I'm claiming my business listing: ${b.name} (${b.id} · ${b.area}).${who} Please also add me to the Klagon business owners group for connections and networking.`;
}

/** Sent to a business owner to claim + join the networking group. */
export function buildInviteMessage(b: { name: string }): string {
  return `Hello ${b.name}! Your business is listed on KLAGON.org — claim your free listing and join the Klagon business owners group for connections and networking. More: https://klagon.org/business · WhatsApp KLAGON on ${ORG_PHONE_DISPLAY}.`;
}

/** Fallback invite when a listing has no contact number — routes through KlagonOrg staff. */
export function buildInviteFallbackMessage(b: { name: string; area: string }): string {
  return `Hi KlagonOrg! ${b.name} (${b.area}) is listed on KLAGON.org but has no contact yet — please reach out and invite them to claim their free listing and join the Klagon business owners group.`;
}

/** Anyone joining the business owners networking group. */
export function buildGroupJoinMessage(): string {
  return "Hi! Please add me to the Klagon business owners group for connections and networking. Thank you.";
}