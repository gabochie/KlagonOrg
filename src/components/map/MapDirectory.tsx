"use client";

// MapDirectory — the /map page beyond the basemap: live stats plus a
// browsable directory of every plotted place (each links to its own
// /map/[slug] page). Gives the page value even before pins load, and
// on any device where the interactive map struggles.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchMapPoints } from "@/lib/map/queries";
import { MAP_LAYERS } from "@/lib/map/layers";
import { buildSlugMap } from "@/lib/map/slugs";
import type { MapPoint } from "@/lib/map/types";

export function MapDirectory() {
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    void fetchMapPoints().then((rows) => {
      if (active) setPoints(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const slugs = useMemo(() => buildSlugMap(points), [points]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? points.filter((p) =>
        `${p.name} ${p.category ?? ""} ${p.community_area ?? ""}`.toLowerCase().includes(q)
      )
    : points;

  const groups = useMemo(
    () =>
      MAP_LAYERS.map((layer) => ({
        layer,
        places: filtered
          .filter((p) => layer.entityTypes.includes(p.entity_type))
          .sort((a, b) => a.name.localeCompare(b.name)),
      })).filter((g) => g.places.length > 0),
    [filtered]
  );

  const others = useMemo(
    () =>
      filtered
        .filter((p) => !MAP_LAYERS.some((l) => l.entityTypes.includes(p.entity_type)))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [filtered]
  );

  if (points.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <div className="text-2xl font-extrabold text-navy">{points.length}</div>
          <div className="text-[11px] font-bold text-gray uppercase tracking-wide">Places plotted</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <div className="text-2xl font-extrabold text-navy">{groups.length}</div>
          <div className="text-[11px] font-bold text-gray uppercase tracking-wide">Categories</div>
        </div>
        <div className="bg-white rounded-xl border border-border p-4 text-center">
          <div className="text-2xl font-extrabold text-navy">
            {new Set(points.map((p) => p.community_area).filter(Boolean)).size}
          </div>
          <div className="text-[11px] font-bold text-gray uppercase tracking-wide">Areas covered</div>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-lg font-extrabold text-navy tracking-tight">Browse every place</h2>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search places…"
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-navy placeholder:text-gray/60 focus:outline-none focus:border-navy w-52"
        />
      </div>

      {filtered.length === 0 && (
        <div className="text-xs text-gray py-6 text-center">
          Nothing matches “{query}” — try a school, clinic or business name.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {groups.map(({ layer, places }) => (
          <div key={layer.key} className="bg-white rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: layer.color }}
              />
              <span className="text-xs font-extrabold text-navy">
                {layer.label} ({places.length})
              </span>
            </div>
            <ul className="flex flex-col">
              {places.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/map/${slugs.get(p.id) ?? p.id}`}
                    className="flex items-baseline justify-between gap-2 py-1.5 border-b border-border/60 last:border-0 text-xs hover:text-blue"
                  >
                    <span className="font-bold text-navy truncate">{p.name}</span>
                    {p.community_area && (
                      <span className="text-[10px] text-gray shrink-0">{p.community_area}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            {places.length > 8 && (
              <div className="text-[10px] text-gray mt-1">
                +{places.length - 8} more — search above or explore the map.
              </div>
            )}
          </div>
        ))}
        {others.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-4">
            <div className="text-xs font-extrabold text-navy mb-2">
              More places ({others.length})
            </div>
            <ul className="flex flex-col">
              {others.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/map/${slugs.get(p.id) ?? p.id}`}
                    className="block py-1.5 border-b border-border/60 last:border-0 text-xs font-bold text-navy truncate hover:text-blue"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
