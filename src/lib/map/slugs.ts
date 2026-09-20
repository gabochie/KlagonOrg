// ------------------------------------------------------------------
// Klagon Knowledge Map — URL slugs for map points.
//
// Slugs are derived deterministically from each point's name and id so
// the client map, the SSG pages and the sitemap all agree without a
// database column. Collisions get a short id suffix, decided in a
// stable (id-sorted) order so rebuilds produce identical URLs.
// ------------------------------------------------------------------

import type { MapPoint } from "./types";

export function slugifyMapName(name: string): string {
  const s = (name ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "place";
}

export function buildSlugMap(points: MapPoint[]): Map<string, string> {
  const sorted = [...points].sort((a, b) => a.id.localeCompare(b.id));
  const counts = new Map<string, number>();
  const out = new Map<string, string>();
  for (const p of sorted) {
    const base = slugifyMapName(p.name);
    const n = counts.get(base) ?? 0;
    counts.set(base, n + 1);
    out.set(p.id, n === 0 ? base : `${base}-${p.id.slice(0, 6)}`);
  }
  return out;
}