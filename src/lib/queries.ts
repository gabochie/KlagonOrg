"use client";

import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type {
  Event,
  Course,
  Project,
  NewsArticle,
  Announcement,
  Badge,
  Metric,
} from "@/types";

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

const client = () => {
  if (!isSupabaseConfigured()) return null;
  return getBrowserClient();
};

// ------------------------------------------------------------------
// public content (eventually replaces the static arrays in constants)
// ------------------------------------------------------------------

export async function fetchPublicEvents(): Promise<Event[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("events_public")
    .select("*")
    .order("date", { ascending: true });
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
  }));
}

export async function fetchPublicProjects(): Promise<Project[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("projects_public")
    .select("*");
  if (error || !data || data.length === 0) return [];
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    icon: r.icon,
    status: r.status as Project["status"],
    volunteers: r.volunteer_count,
    spotsOpen: r.spots_open,
    progress: r.progress,
    color: r.status === "active" ? "#ECFDF5" : "#EEF2FF",
  }));
}

export async function fetchPublicCourses(): Promise<Course[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("courses_public").select("*");
  if (error || !data || data.length === 0) return [];
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    icon: r.icon,
    lessons: r.lesson_count,
    lessonsDone: 0,
    color: "#EEF2FF",
  }));
}

export async function fetchPublicNews(): Promise<NewsArticle[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("news_articles")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });
  if (error || !data || data.length === 0) return [];
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    excerpt: r.excerpt ?? "",
    category: r.category,
    author: r.author_name ?? r.author ?? "KlagonStudios Team",
    date: new Date(r.published_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    image: "📄",
    readTime: `${r.read_time_min} min`,
  }));
}

// ------------------------------------------------------------------
// member data (approved members only — enforce in caller)
// ------------------------------------------------------------------

export async function fetchMyRsvpIds(memberId: string): Promise<string[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("event_rsvps")
    .select("event_id")
    .eq("member_id", memberId);
  if (error || !data) return [];
  return data.map((r) => r.event_id);
}

export async function toggleRsvp(memberId: string, eventId: string, going: boolean) {
  const c = client();
  if (!c) return;
  if (going) {
    await c.from("event_rsvps").insert({ event_id: eventId, member_id: memberId });
  } else {
    await c
      .from("event_rsvps")
      .delete()
      .eq("event_id", eventId)
      .eq("member_id", memberId);
  }
}

export async function fetchMyVolunteerProjectIds(memberId: string): Promise<string[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("project_volunteers")
    .select("project_id")
    .eq("member_id", memberId);
  if (error || !data) return [];
  return data.map((r) => r.project_id);
}

export async function toggleVolunteer(memberId: string, projectId: string, joined: boolean) {
  const c = client();
  if (!c) return;
  if (joined) {
    await c
      .from("project_volunteers")
      .insert({ project_id: projectId, member_id: memberId });
  } else {
    await c
      .from("project_volunteers")
      .delete()
      .eq("project_id", projectId)
      .eq("member_id", memberId);
  }
}

// lesson_progress: member_id + lesson_id unique? We treat as one row per lesson per member.
export async function fetchMyLessonProgress(memberId: string): Promise<string[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("lesson_progress")
    .select("lesson_id")
    .eq("member_id", memberId);
  if (error || !data) return [];
  return data.map((r) => r.lesson_id);
}

export async function fetchMyBadges(memberId: string): Promise<Badge[]> {
  const c = client();
  if (!c) return [];
  const { data: allBadges } = await c.from("badges").select("*");
  const { data: unlocked } = await c
    .from("member_badges")
    .select("badge_id")
    .eq("member_id", memberId);
  if (!allBadges || allBadges.length === 0) return [];
  const unlockedIds = new Set((unlocked ?? []).map((r) => r.badge_id));
  return allBadges.map((b) => ({
    id: b.id,
    name: b.name,
    icon: b.icon,
    unlocked: unlockedIds.has(b.id),
  }));
}

export async function fetchMyMetrics(
  profile: { xp: number } | null,
  memberId: string
): Promise<Metric[]> {
  if (!profile) return [];
  const c = client();
  if (!c) return [];

  const [rsvps, lessonsDone, projectsJoined] = await Promise.all([
    c.from("event_rsvps").select("id", { count: "exact", head: true }).eq("member_id", memberId),
    c.from("lesson_progress").select("id", { count: "exact", head: true }).eq("member_id", memberId),
    c.from("project_volunteers").select("id", { count: "exact", head: true }).eq("member_id", memberId),
  ]);

  return [
    { label: "Events Attended", value: rsvps.count ?? 0, sub: "RSVPs confirmed", accent: "#F59E0B" },
    { label: "Lessons Done", value: lessonsDone.count ?? 0, sub: "Across all courses", accent: "#1A2E8C" },
    { label: "Projects Joined", value: projectsJoined.count ?? 0, sub: "Volunteer roles", accent: "#10B981" },
    { label: "Total XP Earned", value: profile.xp, sub: `Level ${Math.floor(profile.xp / 100) + 1}`, accent: "#FF6B47" },
  ];
}
