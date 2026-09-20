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
      return { ok: false, error: undefined };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
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