import type { MetadataRoute } from "next";
import { getAllPosts, getCategories } from "@/lib/blog";
import { getAllAuthors } from "@/lib/blogAuthors";
import { COURSES } from "@/lib/constants";
import { getSupabase } from "@/lib/supabase";
import type { DirectorySnapshot } from "@/lib/directory";
import snapshotData from "@/data/business-directory.json";
import { getMapPages } from "@/lib/map/data";

export const dynamic = "force-static";

const BASE = "https://klagon.org";

async function getCourseIds(): Promise<string[]> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from("courses_public").select("id");
    if (error || !data || data.length === 0) return COURSES.map((c) => c.id);
    return data.map((r) => r.id as string);
  } catch {
    return COURSES.map((c) => c.id);
  }
}

const ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/blog", changeFrequency: "daily", priority: 0.9 },
  { path: "/events", changeFrequency: "weekly", priority: 0.9 },
  { path: "/culture", changeFrequency: "weekly", priority: 0.8 },
  { path: "/learning", changeFrequency: "weekly", priority: 0.9 },
  { path: "/projects", changeFrequency: "weekly", priority: 0.9 },
  { path: "/news", changeFrequency: "daily", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/mentor", changeFrequency: "monthly", priority: 0.7 },
  { path: "/volunteer", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sponsor", changeFrequency: "monthly", priority: 0.7 },
  { path: "/donate", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/business", changeFrequency: "weekly", priority: 0.9 },
  { path: "/tools/health-score", changeFrequency: "weekly", priority: 0.9 },
  { path: "/map", changeFrequency: "weekly", priority: 0.9 },
  { path: "/classifieds", changeFrequency: "daily", priority: 0.9 },
  { path: "/classifieds/properties", changeFrequency: "daily", priority: 0.8 },
  { path: "/classifieds/vehicles", changeFrequency: "daily", priority: 0.8 },
  { path: "/jobs", changeFrequency: "daily", priority: 0.9 },
  { path: "/visit", changeFrequency: "weekly", priority: 0.9 },
  { path: "/visit/stays", changeFrequency: "daily", priority: 0.9 },
  { path: "/visit/walk", changeFrequency: "weekly", priority: 0.9 },
  { path: "/auth/register", changeFrequency: "monthly", priority: 0.8 },
  { path: "/auth/login", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = ROUTES.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const courses = (await getCourseIds()).map((id) => ({
    url: `${BASE}/learning/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const posts = getAllPosts().map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: p.updated ? new Date(p.updated) : new Date(p.date),
    changeFrequency: "yearly" as const,
    priority: 0.8,
  }));

  const categories = getCategories().map((c) => ({
    url: `${BASE}/blog/category/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const authors = [
    { url: `${BASE}/blog/authors`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.5 },
    ...getAllAuthors().map((a) => ({
      url: `${BASE}/blog/author/${a.slug}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];

  const directory = (snapshotData as unknown as DirectorySnapshot).businesses.map((b) => ({
    url: `${BASE}/directory/${b.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: b.verified ? 0.7 : 0.5,
  }));

  const mapPages = [...(await getMapPages()).slugById.values()].map((slug) => ({
    url: `${BASE}/map/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...base, ...courses, ...posts, ...categories, ...authors, ...directory, ...mapPages];
}
