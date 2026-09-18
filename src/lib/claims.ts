"use client";

// ------------------------------------------------------------------
// Owner claiming for business profiles.
// Member requests -> admin approves -> sponsors.claimed_by links them.
// Owners edit listing fields (trigger locks tier/status/slug/claimed_by),
// reply to reviews, and upload photos to sponsor-media.
// ------------------------------------------------------------------

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { Database } from "@/lib/database.types";

type ClaimRow = Database["public"]["Tables"]["sponsor_claims"]["Row"];

export interface Claim {
  id: string;
  sponsorId: string;
  sponsorName?: string;
  claimantId: string;
  phone: string | null;
  relationship: string | null;
  note: string | null;
  status: string;
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

function mapClaim(row: ClaimRow, sponsorName?: string): Claim {
  return {
    id: row.id,
    sponsorId: row.sponsor_id,
    sponsorName,
    claimantId: row.claimant_id,
    phone: row.phone,
    relationship: row.relationship,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function fileClaim(input: {
  sponsorId: string;
  claimantId: string;
  phone?: string;
  relationship?: string;
  note?: string;
}): Promise<ClaimResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.from("sponsor_claims").insert({
    sponsor_id: input.sponsorId,
    claimant_id: input.claimantId,
    phone: input.phone?.trim() || null,
    relationship: input.relationship?.trim() || null,
    note: input.note?.trim() || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "You already have a claim on this business." };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function fetchMyClaim(sponsorId: string, claimantId: string): Promise<Claim | null> {
  const c = client();
  if (!c) return null;
  const { data } = await c
    .from("sponsor_claims")
    .select("*")
    .eq("sponsor_id", sponsorId)
    .eq("claimant_id", claimantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? mapClaim(data) : null;
}

export async function fetchMyClaimedBusinesses(memberId: string): Promise<{ id: string; name: string; slug: string }[]> {
  const c = client();
  if (!c) return [];
  const { data } = await c
    .from("sponsors")
    .select("id,name,slug")
    .eq("claimed_by", memberId)
    .order("name");
  return (data ?? []) as { id: string; name: string; slug: string }[];
}

// ------------------------------------------------------------------
// admin
// ------------------------------------------------------------------

export async function fetchClaimQueue(): Promise<Claim[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("sponsor_claims")
    .select("*, sponsors(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as (ClaimRow & { sponsors: { name: string } | null })[]).map((r) =>
    mapClaim(r, r.sponsors?.name)
  );
}

export async function approveClaim(claimId: string, sponsorId: string, claimantId: string): Promise<ClaimResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error: linkError } = await c
    .from("sponsors")
    .update({ claimed_by: claimantId })
    .eq("id", sponsorId);
  if (linkError) return { ok: false, error: linkError.message };
  const { error } = await c
    .from("sponsor_claims")
    .update({ status: "approved" })
    .eq("id", claimId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function rejectClaim(claimId: string): Promise<ClaimResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c
    .from("sponsor_claims")
    .update({ status: "rejected" })
    .eq("id", claimId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
