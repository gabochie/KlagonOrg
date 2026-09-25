"use client";

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";

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
