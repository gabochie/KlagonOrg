"use client";

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { recordLeadEvent } from "@/lib/analytics";

// Increment when /volunteer/terms content changes; stored per application.
export const VOLUNTEER_TERMS_VERSION = "2026-09";

export const VOLUNTEER_ID_TYPES = [
  { value: "ghana_card", label: "Ghana Card" },
  { value: "voter_id", label: "Voter ID" },
  { value: "passport", label: "Passport" },
  { value: "drivers_license", label: "Driver's License" },
] as const;

export const VOLUNTEER_STATUSES = [
  "pending",
  "probationary",
  "active",
  "inactive",
  "rejected",
] as const;

export interface VolunteerApplication {
  id: string;
  member_id: string;
  post_id: string | null;
  role: string;
  status: string;
  terms_accepted_at: string;
  terms_version: string;
  id_type: string;
  id_number: string;
  photo_url: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  probation_ends_at: string | null;
  created_at: string;
  member_name?: string | null;
}

const client = () => {
  if (!isSupabaseConfigured()) return null;
  return getBrowserClient();
};

export async function fetchMyVolunteerApplications(
  memberId: string,
): Promise<VolunteerApplication[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("volunteer_applications")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as VolunteerApplication[];
}

const OPEN_STATUSES = ["pending", "probationary", "active"];

export async function fileVolunteerApplication(
  memberId: string,
  input: {
    postId: string | null;
    role: string;
    idType: string;
    idNumber: string;
    photoUrl: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = client();
  if (!c) return { ok: false, error: "Service unavailable. Please try again." };
  const existing = await fetchMyVolunteerApplications(memberId);
  const dup = existing.find(
    (a) =>
      OPEN_STATUSES.includes(a.status) &&
      (input.postId ? a.post_id === input.postId : a.post_id === null && a.role === input.role),
  );
  if (dup) {
    return {
      ok: false,
      error: `You already have an open application for this role (${dup.status}).`,
    };
  }
  const { error } = await c.from("volunteer_applications").insert({
    member_id: memberId,
    post_id: input.postId,
    role: input.role,
    id_type: input.idType,
    id_number: input.idNumber,
    photo_url: input.photoUrl,
    terms_version: VOLUNTEER_TERMS_VERSION,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already have an open application for this role." };
    }
    return { ok: false, error: "Could not submit. Please try again." };
  }
  recordLeadEvent({
    source: "volunteer-apply",
    action: "submit",
    memberId,
    metadata: { role: input.role },
  });
  return { ok: true };
}

export async function fetchVolunteerReviewQueue(): Promise<VolunteerApplication[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("volunteer_applications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !data) return [];
  const apps = data as VolunteerApplication[];
  const memberIds = [...new Set(apps.map((a) => a.member_id))];
  if (memberIds.length === 0) return apps;
  const { data: profiles } = await c
    .from("profiles")
    .select("id,full_name")
    .in("id", memberIds);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  return apps.map((a) => ({ ...a, member_name: names.get(a.member_id) ?? null }));
}

export async function reviewVolunteerApplication(
  applicationId: string,
  status: "probationary" | "active" | "inactive" | "rejected",
  reviewerId: string,
): Promise<boolean> {
  const c = client();
  if (!c) return false;
  const { error } = await c
    .from("volunteer_applications")
    .update({ status, reviewed_by: reviewerId })
    .eq("id", applicationId);
  return !error;
}

export interface OrgRole {
  id: string;
  title: string;
  excerpt: string | null;
  category: string;
  positionType: string | null;
  deadline: string | null;
}

function strField(details: unknown, key: string): string | null {
  if (typeof details !== "object" || details === null) return null;
  const v = (details as Record<string, unknown>)[key];
  return typeof v === "string" ? v : null;
}

/** Org openings flagged for the Volunteer tab (claimable roles). */
export async function fetchOrgVolunteerRoles(): Promise<OrgRole[]> {
  const c = client();
  if (!c) return [];
  const now = new Date().toISOString();
  const { data, error } = await c
    .from("posts")
    .select("id,title,excerpt,category,details,expires_at,published_at")
    .eq("type", "job")
    .eq("status", "approved")
    .lte("published_at", now)
    .eq("details->>org_role", "true")
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    category: r.category,
    positionType: strField(r.details, "position_type"),
    deadline: strField(r.details, "deadline"),
  }));
}

// ------------------------------------------------------------------
// Performance ledger: tasks, hours, reviews
// ------------------------------------------------------------------

export interface VolunteerTask {
  id: string;
  application_id: string;
  title: string;
  description: string | null;
  status: string;
  due_at: string | null;
  created_at: string;
}

export interface VolunteerHours {
  id: string;
  application_id: string;
  member_id: string;
  hours: number;
  worked_on: string;
  note: string | null;
  verified: boolean;
  created_at: string;
}

export interface VolunteerReview {
  id: string;
  application_id: string;
  reviewer_id: string | null;
  rating: number;
  note: string | null;
  created_at: string;
}

export interface VolunteerPerformance {
  application: VolunteerApplication & { member_name: string | null };
  tasksOpen: number;
  tasksDone: number;
  hoursTotal: number;
  hoursVerified: number;
  avgRating: number | null;
  reviewsCount: number;
}

export async function fetchMyVolunteerTasks(memberId: string): Promise<VolunteerTask[]> {
  const apps = await fetchMyVolunteerApplications(memberId);
  if (apps.length === 0) return [];
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("volunteer_tasks")
    .select("*")
    .in(
      "application_id",
      apps.map((a) => a.id),
    )
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as VolunteerTask[];
}

export async function fetchMyVolunteerHours(memberId: string): Promise<VolunteerHours[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("volunteer_hours")
    .select("*")
    .eq("member_id", memberId)
    .order("worked_on", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data as VolunteerHours[];
}

export async function fetchMyVolunteerReviews(memberId: string): Promise<VolunteerReview[]> {
  const apps = await fetchMyVolunteerApplications(memberId);
  if (apps.length === 0) return [];
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("volunteer_reviews")
    .select("*")
    .in(
      "application_id",
      apps.map((a) => a.id),
    )
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as VolunteerReview[];
}

export async function setVolunteerTaskDone(taskId: string, done: boolean): Promise<boolean> {
  const c = client();
  if (!c) return false;
  const { error } = await c
    .from("volunteer_tasks")
    .update({ status: done ? "done" : "open" })
    .eq("id", taskId);
  return !error;
}

export async function logVolunteerHours(
  memberId: string,
  applicationId: string,
  hours: number,
  workedOn: string,
  note: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = client();
  if (!c) return { ok: false, error: "Service unavailable. Please try again." };
  if (!(hours > 0) || hours > 24) {
    return { ok: false, error: "Hours must be between 0 and 24." };
  }
  const { error } = await c.from("volunteer_hours").insert({
    member_id: memberId,
    application_id: applicationId,
    hours,
    worked_on: workedOn,
    note,
  });
  if (error) return { ok: false, error: "Could not log hours. Please try again." };
  return { ok: true };
}

/** Admin: full performance picture across active engagements. */
export async function fetchVolunteerPerformance(): Promise<VolunteerPerformance[]> {
  const c = client();
  if (!c) return [];
  const { data: apps, error } = await c
    .from("volunteer_applications")
    .select("*")
    .in("status", ["probationary", "active"])
    .order("created_at", { ascending: false })
    .limit(200);
  if (error || !apps || apps.length === 0) return [];
  const appIds = apps.map((a) => a.id);
  const memberIds = [...new Set(apps.map((a) => a.member_id))];
  const [{ data: profiles }, { data: tasks }, { data: hours }, { data: reviews }] =
    await Promise.all([
      c.from("profiles").select("id,full_name").in("id", memberIds),
      c.from("volunteer_tasks").select("application_id,status").in("application_id", appIds),
      c.from("volunteer_hours").select("application_id,hours,verified").in("application_id", appIds),
      c.from("volunteer_reviews").select("application_id,rating").in("application_id", appIds),
    ]);
  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
  return apps.map((a) => {
    const t = (tasks ?? []).filter((x) => x.application_id === a.id);
    const h = (hours ?? []).filter((x) => x.application_id === a.id);
    const r = (reviews ?? []).filter((x) => x.application_id === a.id);
    return {
      application: { ...(a as VolunteerApplication), member_name: names.get(a.member_id) ?? null },
      tasksOpen: t.filter((x) => x.status === "open").length,
      tasksDone: t.filter((x) => x.status === "done").length,
      hoursTotal: h.reduce((s, x) => s + Number(x.hours), 0),
      hoursVerified: h.filter((x) => x.verified).reduce((s, x) => s + Number(x.hours), 0),
      avgRating: r.length > 0 ? r.reduce((s, x) => s + x.rating, 0) / r.length : null,
      reviewsCount: r.length,
    };
  });
}

export async function createVolunteerTask(
  applicationId: string,
  title: string,
  description: string | null,
  dueAt: string | null,
  createdBy: string,
): Promise<boolean> {
  const c = client();
  if (!c || !title.trim()) return false;
  const { error } = await c.from("volunteer_tasks").insert({
    application_id: applicationId,
    title: title.trim(),
    description,
    due_at: dueAt,
    created_by: createdBy,
  });
  return !error;
}

export async function verifyVolunteerHours(hourId: string, verified: boolean): Promise<boolean> {
  const c = client();
  if (!c) return false;
  const { error } = await c
    .from("volunteer_hours")
    .update({ verified })
    .eq("id", hourId);
  return !error;
}

export async function postVolunteerReview(
  applicationId: string,
  reviewerId: string,
  rating: number,
  note: string | null,
): Promise<boolean> {
  const c = client();
  if (!c || rating < 1 || rating > 5) return false;
  const { error } = await c.from("volunteer_reviews").insert({
    application_id: applicationId,
    reviewer_id: reviewerId,
    rating,
    note,
  });
  return !error;
}

export async function fetchApplicationHours(
  applicationId: string,
): Promise<VolunteerHours[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("volunteer_hours")
    .select("*")
    .eq("application_id", applicationId)
    .order("worked_on", { ascending: false });
  if (error || !data) return [];
  return data as VolunteerHours[];
}
