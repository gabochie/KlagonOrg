"use client";

// ------------------------------------------------------------------
// Visit Klagon — reviews query layer.
// Staff-seeded trust first: the team visits, photographs, and reviews;
// visitors add theirs later. Same shape serves stays and posts.
// ------------------------------------------------------------------

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { Database } from "@/lib/database.types";

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

export interface Review {
  id: string;
  sponsorId: string | null;
  postId: string | null;
  reviewerName: string;
  rating: number;
  title: string | null;
  body: string | null;
  photos: string[];
  staffPick: boolean;
  reply: string | null;
  helpful: number;
  createdAt: string;
}

export interface ReviewSummary {
  count: number;
  average: number | null;
}

function mapReview(row: ReviewRow): Review {
  return {
    id: row.id,
    sponsorId: row.sponsor_id,
    postId: row.post_id,
    reviewerName: row.reviewer_name,
    rating: row.rating,
    title: row.title,
    body: row.body,
    photos: row.photos ?? [],
    staffPick: row.staff_pick,
    reply: row.reply,
    helpful: row.helpful,
    createdAt: row.created_at,
  };
}

const client = () => {
  if (!isSupabaseConfigured()) return null;
  return getBrowserClient();
};

export async function fetchSponsorReviews(sponsorId: string, limit = 20): Promise<Review[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("reviews")
    .select("*")
    .eq("sponsor_id", sponsorId)
    .eq("status", "approved")
    .order("staff_pick", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map(mapReview);
}

export async function fetchSponsorRating(sponsorId: string): Promise<ReviewSummary> {
  const reviews = await fetchSponsorReviews(sponsorId, 100);
  if (reviews.length === 0) return { count: 0, average: null };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { count: reviews.length, average: Math.round((sum / reviews.length) * 10) / 10 };
}

export interface SubmitReviewResult {
  ok: boolean;
  error?: string;
}

export async function submitSponsorReview(input: {
  sponsorId: string;
  reviewerName: string;
  rating: number;
  title?: string;
  body?: string;
}): Promise<SubmitReviewResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const name = input.reviewerName.trim();
  const rating = Math.round(input.rating);
  if (!name) return { ok: false, error: "Tell us your name." };
  if (rating < 1 || rating > 5) return { ok: false, error: "Pick a rating from 1 to 5." };
  const { error } = await c.from("reviews").insert({
    sponsor_id: input.sponsorId,
    reviewer_name: name,
    rating,
    title: input.title?.trim() || null,
    body: input.body?.trim() || null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function markReviewHelpful(reviewId: string): Promise<boolean> {
  const c = client();
  if (!c) return false;
  const { error } = await c.rpc("bump_review_helpful", { p_review_id: reviewId });
  return !error;
}

// ------------------------------------------------------------------
// moderation (admin)
// ------------------------------------------------------------------

export async function fetchReviewQueue(status = "pending"): Promise<Review[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("reviews")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: true })
    .limit(100);
  if (error || !data) return [];
  return data.map(mapReview);
}

export async function moderateReview(
  reviewId: string,
  action: "approved" | "rejected",
  opts?: { reply?: string; staffPick?: boolean }
): Promise<SubmitReviewResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const patch: Database["public"]["Tables"]["reviews"]["Update"] = {
    status: action,
    reply: opts?.reply?.trim() || null,
    replied_at: opts?.reply?.trim() ? new Date().toISOString() : null,
    staff_pick: opts?.staffPick ?? false,
  };
  const { error } = await c.from("reviews").update(patch).eq("id", reviewId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
