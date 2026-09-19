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
  Activity,
} from "@/types";

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

export function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

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
    author: r.author_name ?? r.author ?? "KLAGON.org Team",
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

// ------------------------------------------------------------------
// admin data (require is_admin — enforce in caller)
// ------------------------------------------------------------------

export interface AdminMetrics {
  cards: Metric[];
  registrationTrend: { label: string; value: number; pct: number; isLatest: boolean }[];
}

export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const c = client();
  if (!c) {
    return { cards: [], registrationTrend: [] };
  }

  const now = new Date();
  const totalApproved = c
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const weeklyActive = c
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved")
    .gte("created_at", weekAgo);

  const [membersResult, weekResult] = await Promise.all([totalApproved, weeklyActive]);

  const eventsResult = await c
    .from("events_public")
    .select("*")
    .gte("date", now.toISOString().slice(0, 10))
    .order("date", { ascending: true });
  const projectsResult = await c
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  // registrations per week over the last 8 weeks
  const { data: regs } = await c
    .from("profiles")
    .select("created_at")
    .gte("created_at", new Date(now.getTime() - 7 * 8 * 24 * 60 * 60 * 1000).toISOString());
  const buckets: number[] = new Array(8).fill(0);
  for (let i = 0; i < 8; i++) {
    const end = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const start = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    buckets[7 - i] = (regs ?? []).filter(
      (r) => new Date(r.created_at) < end && new Date(r.created_at) >= start
    ).length;
  }
  const cumulative: number[] = [];
  buckets.reduce((acc, v) => {
    acc += v;
    cumulative.push(acc);
    return acc;
  }, 0);
  const max = Math.max(...cumulative, 1);
  const registrationTrend = cumulative.map((v, i) => ({
    label: `Wk${i + 1}`,
    value: v,
    pct: Math.max(Math.round((v / max) * 100), 4),
    isLatest: i === cumulative.length - 1,
  }));

  const total = membersResult.count ?? 0;
  const cards: Metric[] = [
    { label: "Total Members", value: total, sub: "Approved profiles", accent: "#0F1B5C" },
    { label: "Weekly Active", value: weekResult.count ?? 0, sub: "Approved this week", accent: "#F59E0B" },
    { label: "Upcoming Sessions", value: eventsResult?.data?.length ?? 0, sub: "Published events", accent: "#10B981" },
    { label: "Active Projects", value: projectsResult.count ?? 0, sub: "In progress", accent: "#FF6B47" },
  ];

  return { cards, registrationTrend };
}

export async function fetchAdminEvents(): Promise<Event[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("events_public")
    .select("*")
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date", { ascending: true })
    .limit(5);
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

export async function fetchActivityFeed(): Promise<Activity[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6);
  if (error || !data || data.length === 0) return [];

  return data.map((a) => {
    const action = a.action ?? "";
    let icon = "📌";
    let iconBg = "#EEF2FF";
    if (action.includes("member_approve")) { icon = "✅"; iconBg = "#ECFDF5"; }
    else if (action.includes("member_reject")) { icon = "⛔"; iconBg = "#FFF3F0"; }
    else if (action.includes("event")) { icon = "📅"; iconBg = "#FFF7E6"; }
    else if (action.includes("project")) { icon = "🛠️"; iconBg = "#F0F9FF"; }

    const human = action.replaceAll("_", " ");
    const who = a.actor_id ? "" : "System";
    return {
      id: `${a.id}`,
      icon,
      iconBg,
      title: `${human}${who ? ` by ${who}` : ""}${a.entity ? ` on ${a.entity.replaceAll("_", " ")}` : ""}`,
      time: timeAgo(a.created_at),
    };
  });
}

export interface InterestSlice {
  label: string;
  value: number;
  color: string;
}

const INTEREST_COLORS = ["#0F1B5C", "#F59E0B", "#10B981", "#FF6B47", "#8B5CF6", "#0EA5E9"];

export async function fetchInterestDistribution(): Promise<InterestSlice[]> {
  const c = client();
  if (!c) return [];
  const { data, error } = await c.from("profiles").select("interests");
  if (error || !data || data.length === 0) return [];

  const counts = new Map<string, number>();
  for (const p of data) {
    for (const i of p.interests ?? []) {
      counts.set(i, (counts.get(i) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([label, value], idx) => ({
      label,
      value,
      color: INTEREST_COLORS[idx % INTEREST_COLORS.length],
    }));
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
