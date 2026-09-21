"use client";

// ------------------------------------------------------------------
// Klagon events — member submissions + admin approval.
// Members submit events (status='pending'), admins moderate via the
// moderate_event() RPC, and the public events_public view only exposes
// approved rows. Mirrors src/lib/posts.ts conventions.
// Backing schema: supabase/migrations/20260919000000_member_event_submissions.sql
// ------------------------------------------------------------------

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { Database, EventType, MemberStatus } from "@/lib/database.types";
import type { Event } from "@/types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

const client = () => {
  if (!isSupabaseConfigured()) return null;
  return getBrowserClient();
};

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  workshop: "Workshop",
  hackathon: "Hackathon",
  leadership: "Leadership",
  service: "Community Service",
};

export const EVENT_STATUS_LABELS: Record<MemberStatus, string> = {
  pending: "Pending review",
  approved: "Live",
  rejected: "Needs changes",
};

/** Tickboxes available when proposing an event — horizontal themes. */
export const EVENT_TAG_OPTIONS = ["cultural", "music", "festival", "heritage"] as const;

/** Culture-hub filter: an event counts as culture when any tag overlaps. */
export const CULTURE_TAGS = ["cultural", "music", "festival", "heritage"] as const;

export interface EventInput {
  title: string;
  type: EventType;
  description?: string | null;
  date: string;
  time: string;
  location?: string | null;
  spots?: number;
  tags?: string[];
}

export interface EventSubmission {
  id: string;
  title: string;
  type: EventType;
  description: string;
  date: string;
  time: string;
  location: string;
  spots: number;
  status: MemberStatus;
  rejectedReason: string | null;
  published: boolean;
  authorName: string;
  createdAt: string;
  tags: string[];
}

export interface ModerateResult {
  ok: boolean;
  id?: string;
  error?: string;
}

function mapEvent(row: EventRow, authorName = "Member"): EventSubmission {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    description: row.description ?? "",
    date: row.date,
    time: row.time,
    location: row.location ?? "",
    spots: row.spots,
    status: row.status,
    rejectedReason: row.rejected_reason,
    published: row.published,
    authorName,
    createdAt: row.created_at,
    tags: row.tags ?? [],
  };
}

// ------------------------------------------------------------------
// member submits/edits their own proposal
// ------------------------------------------------------------------

export async function submitEvent(input: EventInput, memberId: string): Promise<ModerateResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { data, error } = await c
    .from("events")
    .insert({
      title: input.title.trim(),
      type: input.type,
      description: input.description?.trim() || null,
      date: input.date,
      time: input.time,
      location: input.location?.trim() || null,
      spots: input.spots ?? 0,
      tags: input.tags ?? [],
      published: false,
      status: "pending",
      created_by: memberId,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data.id };
}

/** Edit a still-pending proposal; back to pending if it was rejected. */
export async function updateMyEvent(
  eventId: string,
  input: Partial<EventInput>,
  memberId: string
): Promise<ModerateResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const patch: Database["public"]["Tables"]["events"]["Update"] = {
    ...(input.title !== undefined ? { title: input.title.trim() } : {}),
    ...(input.type !== undefined ? { type: input.type } : {}),
    ...(input.description !== undefined ? { description: input.description?.trim() || null } : {}),
    ...(input.date !== undefined ? { date: input.date } : {}),
    ...(input.time !== undefined ? { time: input.time } : {}),
    ...(input.location !== undefined ? { location: input.location?.trim() || null } : {}),
    ...(input.spots !== undefined ? { spots: input.spots } : {}),
    ...(input.tags !== undefined ? { tags: input.tags } : {}),
    ...(input.spots !== undefined || input.date !== undefined
      ? { status: "pending", rejected_reason: null }
      : {}),
  };
  const { error } = await c.from("events").update(patch).eq("id", eventId).eq("created_by", memberId);
  if (error) return { ok: false, error: error.message };
  return { ok: true, id: eventId };
}

/** Withdraw a still-pending proposal. */
export async function withdrawEvent(eventId: string, memberId: string): Promise<ModerateResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.from("events").delete().eq("id", eventId).eq("created_by", memberId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function fetchMyEventSubmissions(memberId: string): Promise<EventSubmission[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("events")
    .select("*")
    .eq("created_by", memberId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => mapEvent(r));
}

// ------------------------------------------------------------------
// admin moderation
// ------------------------------------------------------------------

export async function fetchEventModerationQueue(status: MemberStatus = "pending"): Promise<EventSubmission[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("events")
    .select("*, author:profiles!events_created_by_fkey(full_name)")
    .eq("status", status)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as (EventRow & { author: { full_name: string | null } | null })[]).map((r) =>
    mapEvent(r, r.author?.full_name ?? "Member")
  );
}

export async function approveEvent(eventId: string): Promise<ModerateResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.rpc("moderate_event", { p_event_id: eventId, p_status: "approved" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function rejectEvent(eventId: string, reason: string): Promise<ModerateResult> {
  const c = client();
  if (!c) return { ok: false, error: "Supabase is not configured." };
  const { error } = await c.rpc("moderate_event", {
    p_event_id: eventId,
    p_status: "rejected",
    p_reason: reason,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ------------------------------------------------------------------
// The Culture Hub
// ------------------------------------------------------------------

export async function fetchCultureEvents(limit = 30): Promise<Event[]> {
  const c = client();
  if (!c) return [];
  // Local calendar day (not UTC) so near-midnight events aren't wrongly excluded.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const { data, error } = await c
    .from("events_public")
    .select("*")
    .overlaps("tags", CULTURE_TAGS as unknown as string[])
    .gte("date", today)
    .order("date", { ascending: true })
    .limit(limit);
  if (error || !data || data.length === 0) return [];
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    date: r.date,
    time: r.time,
    location: r.location ?? "TBD",
    spots: r.spots,
    spotsLeft: r.spots_left,
    rsvpCount: r.rsvp_count,
    tags: r.tags ?? [],
  }));
}