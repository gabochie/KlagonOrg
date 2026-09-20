// ------------------------------------------------------------------
// Klagon Knowledge Map — build-time data access (server only).
//
// Maps the live `map_points_public` view into MapPoint rows for the
// SSG entity pages (/map/[slug]) and the sitemap. Fails open to an
// empty list so a transient Supabase outage never breaks the build;
// with no rows the entity routes simply aren't generated.
// ------------------------------------------------------------------

import { getSupabase } from "@/lib/supabase";
import type { MapPoint } from "@/lib/map/types";
import { buildSlugMap } from "@/lib/map/slugs";

export async function fetchPublicMapPoints(): Promise<MapPoint[]> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb.from("map_points_public").select("*");
    if (error || !data) return [];
    return data.map((r) => ({
      id: r.id,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      name: r.name,
      description: r.description,
      category: r.category,
      latitude: r.latitude,
      longitude: r.longitude,
      community_area: r.community_area,
      severity: r.severity,
      icon: r.icon,
      created_at: r.created_at,
    }));
  } catch {
    return [];
  }
}

export interface MapPages {
  points: MapPoint[];
  slugById: Map<string, string>;
  bySlug: Map<string, MapPoint>;
}

export async function getMapPages(): Promise<MapPages> {
  const points = await fetchPublicMapPoints();
  const slugById = buildSlugMap(points);
  const bySlug = new Map<string, MapPoint>();
  for (const p of points) {
    const slug = slugById.get(p.id);
    if (slug) bySlug.set(slug, p);
  }
  return { points, slugById, bySlug };
}