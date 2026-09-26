"use client";

// ------------------------------------------------------------------
// Klagon Hyperlocal Community Portal — posts query layer
// Mirrors src/lib/queries.ts conventions (browser Supabase client,
// graceful empty fallbacks when Supabase is not configured).
// Backing schema: supabase/migrations/20260917120000_hyperlocal_portal.sql
// ------------------------------------------------------------------

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { recordLeadEvent } from "@/lib/analytics";
import type { Database, Json } from "@/lib/database.types";
import type {
  AuthorBadge,
  Post,
  PostArea,
  PostFilters,
  PostInput,
  PostStatus,
  PostType,
  BoostTier,
} from "@/types";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

const client = () => {
  if (!isSupabaseConfigured()) return null;
  return getBrowserClient();
};

// ------------------------------------------------------------------
// constants
// ------------------------------------------------------------------

export const POST_TYPE_LABELS: Record<PostType, string> = {
  news: "News",
  event: "Events",
  business: "Business",
  classified: "Classifieds",
  job: "Jobs",
  announcement: "Announcements",
};

export const AREA_LABELS: Record<PostArea, string> = {
  klagon: "Klagon",
  tema_west: "Tema West",
  other: "Other",
};

/** Marketplace verticals — segmented posting & browsing. */
export const VERTICALS = ["Properties", "Auto", "Goods", "Services", "Jobs"] as const;
export type Vertical = (typeof VERTICALS)[number];

export const CATEGORY_SEEDS: Record<PostType, string[]> = {
  news: [
    "General",
    "Community",
    "Education",
    "Health",
    "Business",
    "Sports",
    "Crime & Safety",
    "Local Market",
    "Chieftaincy & Culture",
    "Arts & Music",
  ],
  event: ["Workshop", "Social", "Sports", "Fundraiser", "Religious", "Other"],
  business: ["Retail", "Food & Drink", "Services", "Transportation", "Tech", "Other"],
  classified: ["Properties", "Auto", "Goods", "Services", "Jobs"],
  job: ["Full-time", "Part-time", "Gig/Freelance", "Internship", "Volunteer"],
  announcement: ["General", "Safety", "Utilities", "Community"],
};

/** News categories that make up The Culture Hub feed. */
export const CULTURE_CATEGORIES = ["Arts & Music", "Chieftaincy & Culture"] as const;

export const PROPERTY_SUBCATEGORIES = [
  "House",
  "Flat/Apartment",
  "Land",
  "Commercial space",
  "Office",
  "Shop/Store",
  "Airbnb/short-stay",
] as const;

export const AUTO_SUBCATEGORIES = ["Cars", "Saloon", "SUV", "Pickups/Trucks", "Motorcycles"] as const;

export interface BoostPrice {
  tier: BoostTier;
  feeGhs: number;
  days: number;
  label: string;
}

/** Boost pricing (matches the purchase_boost() RPC). */
export const BOOST_PRICING: BoostPrice[] = [
  { tier: "premium", feeGhs: 50, days: 7, label: "Properties / Auto premium" },
  { tier: "featured", feeGhs: 30, days: 3, label: "Standard (news, job, business)" },
  { tier: "featured", feeGhs: 20, days: 3, label: "Classifieds vertical" },
];

/** Resolve the boost price for a given post shape. */
export function boostPriceFor(postType: PostType, category?: string | null): BoostPrice {
  if (postType === "classified" && (category === "Properties" || category === "Auto")) {
    return BOOST_PRICING[0];
  }
  if (postType === "classified") return BOOST_PRICING[2];
  return BOOST_PRICING[1];
}

// ------------------------------------------------------------------
// serialization
// ------------------------------------------------------------------

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

export function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    category: row.category,
    subcategory: row.subcategory,
    details: asRecord(row.details),
    area: row.area,
    status: row.status,
    rejectedReason: row.rejected_reason,
    submittedBy: row.submitted_by,
    authorName: row.author_name ?? "Community Member",
    authorBadge: row.author_badge,
    coverUrl: row.cover_url,
    gallery: asStringArray(row.gallery),
    priceGhs: row.price_ghs,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    eventDate: row.event_date,
    eventTime: row.event_time,
    eventLocation: row.event_location,
    boostTier: row.boost_tier,
    boostFeeGhs: row.boost_fee_ghs,
    boostUntil: row.boost_until,
    reports: row.reports,
    views: row.views,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ------------------------------------------------------------------
// public reads
// ------------------------------------------------------------------

/** True once a listing has passed its auto-expiry date (jobs). */
export function isPostExpired(post: Pick<Post, "expiresAt">, now = new Date()): boolean {
  return Boolean(post.expiresAt && new Date(post.expiresAt) <= now);
}

export async function fetchPortalPosts(filters: PostFilters = {}): Promise<Post[]> {
  const c = client();
  if (!c) return [];

  const now = new Date().toISOString();

  const base = () => {
    let q = c
      .from("posts")
      .select("*")
      .eq("status", "approved")
      .lte("published_at", now)
      .lt("reports", 3);
    if (filters.type && filters.type !== "all") q = q.eq("type", filters.type);
    if (filters.area && filters.area !== "all") q = q.eq("area", filters.area);
    if (filters.category) q = q.eq("category", filters.category);
    if (filters.subcategory) q = q.eq("subcategory", filters.subcategory);
    if (filters.search) {
      const q2 = filters.search.replace(/[%,()]/g, "").trim();
      if (q2) q = q.or(`title.ilike.%${q2}%,excerpt.ilike.%${q2}%,category.ilike.%${q2}%`);
    }
    if (filters.excludeOrgRoles) {
      q = q.or("details->>org_role.is.null,details->>org_role.neq.true");
    }
    return q
      .order("boost_until", { ascending: false, nullsFirst: false })
      .order("published_at", { ascending: false })
      .limit(filters.limit ?? 60);
  };

  let { data, error } = await base().or(`expires_at.is.null,expires_at.gt.${now}`);
  // Fall back gracefully before the expiry migration is applied (column missing).
  if (error && /expires_at/i.test(error.message)) {
    ({ data, error } = await base());
  }
  if (error || !data) return [];
  return data.map(mapPost);
}

export async function fetchFeaturedPosts(limit = 3): Promise<Post[]> {
  const c = client();
  if (!c) return [];
  const now = new Date().toISOString();

  const base = () =>
    c
      .from("posts")
      .select("*")
      .eq("status", "approved")
      .not("boost_until", "is", null)
      .gt("boost_until", now)
      .lt("reports", 3)
      .order("boost_until", { ascending: false })
      .limit(limit);

  let { data, error } = await base().or(`expires_at.is.null,expires_at.gt.${now}`);
  // Fall back gracefully before the expiry migration is applied (column missing).
  if (error && /expires_at/i.test(error.message)) {
    ({ data, error } = await base());
  }
  if (error || !data) return [];
  return data.map(mapPost);
}

export async function fetchPostById(id: string): Promise<Post | null> {
  const c = client();
  if (!c) return null;
  const { data, error } = await c.from("posts").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapPost(data);
}

/** Approved news posts within the culture categories (The Culture Hub feed). */
export async function fetchCulturePosts(limit = 20): Promise<Post[]> {
  const c = client();
  if (!c) return [];
  const now = new Date().toISOString();

  const base = () =>
    c
      .from("posts")
      .select("*")
      .eq("status", "approved")
      .eq("type", "news")
      .in("category", CULTURE_CATEGORIES)
      .lte("published_at", now)
      .lt("reports", 3)
      .order("published_at", { ascending: false })
      .limit(limit);

  let { data, error } = await base().or(`expires_at.is.null,expires_at.gt.${now}`);
  // Fall back gracefully before the expiry migration is applied (column missing).
  if (error && /expires_at/i.test(error.message)) {
    ({ data, error } = await base());
  }
  if (error || !data || data.length === 0) return [];
  return data.map(mapPost);
}

export interface CultureCreator {
  id: string;
  name: string;
  badge: AuthorBadge;
  postCount: number;
}

/** People behind approved culture posts — surfaced as local creatives. */
export async function fetchCultureCreators(): Promise<CultureCreator[]> {
  const posts = await fetchCulturePosts(200);
  const byMember = new Map<string, { name: string; badge: AuthorBadge }>();
  const count = new Map<string, number>();
  for (const p of posts) {
    if (!p.submittedBy) continue;
    count.set(p.submittedBy, (count.get(p.submittedBy) ?? 0) + 1);
    if (!byMember.has(p.submittedBy)) {
      byMember.set(p.submittedBy, {
        name: p.authorName.replace(/^Community Member$/, "Unnamed contributor"),
        badge: p.authorBadge,
      });
    }
  }
  return [...count.entries()]
    .map(([id, postCount]) => ({ id, ...(byMember.get(id) as { name: string; badge: AuthorBadge }), postCount }))
    .sort((a, b) => b.postCount - a.postCount);
}

// ------------------------------------------------------------------
// member reads / writes
// ------------------------------------------------------------------

export async function fetchMyPosts(memberId: string): Promise<Post[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("posts")
    .select("*")
    .eq("submitted_by", memberId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapPost);
}

export interface SubmitResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function submitPost(input: PostInput, memberId: string): Promise<SubmitResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };

  const { data, error } = await c
    .from("posts")
    .insert({
      ...input,
      submitted_by: memberId,
      status: "pending",
      boost_tier: "none",
      gallery: (input.gallery ?? []) as Json,
      details: (input.details ?? {}) as Json,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

export async function updateMyPost(postId: string, input: Partial<PostInput>): Promise<SubmitResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const patch: Database["public"]["Tables"]["posts"]["Update"] = {
    ...input,
    details: input.details as Json | undefined,
    gallery: input.gallery as Json | undefined,
  };
  const { error } = await c.from("posts").update(patch).eq("id", postId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: postId };
}

/** Re-submit a rejected post: back to pending, clears the rejection reason. */
export async function resubmitPost(postId: string): Promise<SubmitResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c
    .from("posts")
    .update({ status: "pending", rejected_reason: null })
    .eq("id", postId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: postId };
}

export async function deleteMyPost(postId: string): Promise<SubmitResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.from("posts").delete().eq("id", postId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ------------------------------------------------------------------
// moderation (admin)
// ------------------------------------------------------------------

export async function fetchModerationQueue(status: PostStatus = "pending"): Promise<Post[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("posts")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map(mapPost);
}

export async function approvePost(postId: string): Promise<SubmitResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c
    .from("posts")
    .update({ status: "approved", published_at: new Date().toISOString(), rejected_reason: null })
    .eq("id", postId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: postId };
}

export async function rejectPost(postId: string, reason: string): Promise<SubmitResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c
    .from("posts")
    .update({ status: "rejected", rejected_reason: reason })
    .eq("id", postId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: postId };
}

// ------------------------------------------------------------------
// reports / views / contact relay / newsletter / boost
// ------------------------------------------------------------------

export async function reportPost(
  postId: string,
  memberId: string,
  reason?: string
): Promise<SubmitResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c
    .from("post_reports")
    .insert({ post_id: postId, reported_by: memberId, reason: reason ?? null });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function recordPostView(postId: string): Promise<void> {
  const c = client();
  if (!c) return;
  await c.from("post_views").insert({ post_id: postId });
}

export interface ContactMessageInput {
  post_id: string;
  sender_name?: string | null;
  sender_phone?: string | null;
  sender_email?: string | null;
  message: string;
}

export async function sendContactMessage(input: ContactMessageInput): Promise<SubmitResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.from("post_contact_messages").insert(input);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function subscribeToNewsletter(
  email: string,
  phone?: string,
  source = "portal"
): Promise<SubmitResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c
    .from("subscribers")
    .insert({ email, phone: phone ?? null, source, subscribed: true });
  if (error) {
    if (error.code === "23505") return { ok: true };
    return { ok: false, error: error.message };
  }
  recordLeadEvent({ source: "newsletter", action: "subscribe", metadata: { source } });
  return { ok: true };
}

/** Purchase a boost. Delegates pricing validation to the purchase_boost() RPC. */
export async function purchaseBoost(postId: string, tier: BoostTier): Promise<SubmitResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { data, error } = await c.rpc("purchase_boost", { p_post_id: postId, p_tier: tier });
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Boost could not be applied to this post." };
  return { ok: true, id: postId };
}
