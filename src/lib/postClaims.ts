"use client";

// ------------------------------------------------------------------
// Listing ownership claims for posts (classifieds and beyond).
//
// A seeded or чужой listing is claimed, not reposted: the agent files
// with the phone number from their original advert, staff verify it in
// the WhatsApp thread (the message must come FROM that number), then
// approve — submitted_by + contact_phone transfer, claimable flag goes.
// Super admins use the same approve path (they pass is_admin).
//
// Image rule lives here too: cover + gallery combined max 3 images,
// gallery array max 2. The DB CHECK enforces it; these helpers let the
// UI enforce it before upload.
// ------------------------------------------------------------------

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { normalizePhone } from "@/lib/outreach";
import type { Database } from "@/lib/database.types";

type ClaimRow = Database["public"]["Tables"]["post_claims"]["Row"];

/** Cover counts as image one; gallery holds at most two more. */
export const MAX_IMAGES_TOTAL = 3;
export const MAX_GALLERY = MAX_IMAGES_TOTAL - 1;

export interface PostClaim {
  id: number;
  postId: string;
  postTitle?: string;
  claimantId: string;
  claimantName?: string;
  phone: string;
  note: string | null;
  status: string;
  createdAt: string;
}

export interface ClaimResult {
  ok: boolean;
  error?: string;
}

/** The number must be the one on the original advert — staff verify it. */
export function validateClaimPhone(raw: string): string | null {
  const digits = normalizePhone(raw ?? "");
  if (!digits) return "Enter the phone number from your original advert (9–15 digits).";
  return digits;
}

export function totalImages(coverUrl: string | null, gallery: string[]): number {
  return (coverUrl ? 1 : 0) + gallery.length;
}

/** Room left for more images given the current cover + gallery. */
export function imageSlotsLeft(coverUrl: string | null, gallery: string[]): number {
  return Math.max(0, MAX_IMAGES_TOTAL - totalImages(coverUrl, gallery));
}

const client = () => {
  if (!isSupabaseConfigured()) return null;
  return getBrowserClient();
};

function mapClaim(
  row: ClaimRow,
  postTitle?: string,
  claimantName?: string
): PostClaim {
  return {
    id: row.id,
    postId: row.post_id,
    postTitle,
    claimantId: row.claimant_id,
    claimantName,
    phone: row.phone,
    note: row.note,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function filePostClaim(input: {
  postId: string;
  claimantId: string;
  phone: string;
  note?: string;
}): Promise<ClaimResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const digits = normalizePhone(input.phone ?? "");
  if (!digits) return { ok: false, error: "Enter the phone number from your original advert." };
  const { error } = await c.from("post_claims").insert({
    post_id: input.postId,
    claimant_id: input.claimantId,
    phone: digits,
    note: input.note?.trim() || null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "You already have a claim on this listing." };
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/** This member's claim on this post, if any (drives pending/claimed UI). */
export async function fetchMyPostClaim(
  postId: string,
  memberId: string
): Promise<PostClaim | null> {
  const c = client();
  if (!c) return null;
  const { data, error } = await c
    .from("post_claims")
    .select("*")
    .eq("post_id", postId)
    .eq("claimant_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return mapClaim(data);
}

/** Pending claims with post + claimant names (admin moderation). */
export async function fetchPostClaimsQueue(
  status = "pending"
): Promise<PostClaim[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("post_claims")
    .select(
      "*, post:posts!post_claims_post_id_fkey(title), claimant:profiles!post_claims_claimant_id_fkey(full_name)"
    )
    .eq("status", status)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (
    data as (ClaimRow & {
      post: { title: string } | null;
      claimant: { full_name: string | null } | null;
    })[]
  ).map((r) => mapClaim(r, r.post?.title ?? "(deleted post)", r.claimant?.full_name ?? "Member"));
}

/**
 * Approve: transfer the listing (owner + verified number), drop the
 * claimable flag so the banner disappears, mark the claim approved.
 * Admin RLS (posts_admin_all) permits both writes.
 */
export async function approvePostClaim(
  claim: PostClaim,
  claimantName: string | null
): Promise<ClaimResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { data: post, error: readErr } = await c
    .from("posts")
    .select("details")
    .eq("id", claim.postId)
    .maybeSingle();
  if (readErr || !post) return { ok: false, error: "Listing not found." };
  const details = { ...((post.details as Record<string, unknown> | null) ?? {}) };
  delete details.claimable;
  const { error: postErr } = await c
    .from("posts")
    .update({
      submitted_by: claim.claimantId,
      contact_phone: claim.phone,
      author_name: claimantName ?? undefined,
      details: details as Database["public"]["Tables"]["posts"]["Update"]["details"],
    })
    .eq("id", claim.postId);
  if (postErr) return { ok: false, error: postErr.message };
  const { error: claimErr } = await c
    .from("post_claims")
    .update({ status: "approved" })
    .eq("id", claim.id);
  if (claimErr) return { ok: false, error: claimErr.message };
  return { ok: true };
}

export async function rejectPostClaim(id: number): Promise<ClaimResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.from("post_claims").update({ status: "rejected" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
