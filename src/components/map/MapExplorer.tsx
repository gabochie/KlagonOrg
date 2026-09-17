"use client";

// ------------------------------------------------------------------
// Klagon Map — MapExplorer
// The flagship geographic interface at /map/. Renders a MapLibre map
// with clustered, filterable layers over Klagon's geo data
// (from the map_points / map_points_public tables).
//
// - Layers are driven by MAP_LAYERS (src/lib/map/layers.ts).
// - Basemap is either a self-hosted PMTiles extract (R2) or, when
//   NEXT_PUBLIC_MAP_TILES_URL is unset, an OSM raster fallback so
//   local dev works with zero setup.
// - Everything is client-side (static export safe). maplibre-gl and
//   pmtiles are imported lazily inside effects to keep SSR clean.
// ------------------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from "react";
import type { Feature, Point } from "geojson";
import { Loader2, Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

import { fetchMapPoints } from "@/lib/map/queries";
import { isSupabaseConfigured } from "@/lib/supabase-browser";
import { MAP_LAYERS } from "@/lib/map/layers";
import {
  KLAGON_CENTER,
  KLAGON_ZOOM,
  KLAGON_MIN_ZOOM,
  KLAGON_MAX_ZOOM,
  KLAGON_CLUSTER_MAX_ZOOM,
  MAP_ATTRIBUTION,
  MAP_TILES_URL,
  MAP_STYLE_URL,
  OSM_RASTER_TILES,
} from "@/lib/map/tiles";
import { SEVERITY_META } from "@/lib/map/types";
import type { MapEntityType, MapPoint } from "@/lib/map/types";

import basemapStyle from "./basemap-style.json";

interface PointProps {
  pid: string;
  name: string;
  entity_type: MapEntityType;
  icon: string | null;
  category: string | null;
  community_area: string | null;
  description: string | null;
  severity: string | null;
  entity_id: string | null;
}

function matchesQuery(p: MapPoint, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  return `${p.name} ${p.category ?? ""} ${p.community_area ?? ""}`
    .toLowerCase()
    .includes(t);
}

function toFeature(p: MapPoint): Feature<Point, PointProps> {
  return {
    type: "Feature",
    properties: {
      pid: p.id,
      name: p.name,
      entity_type: p.entity_type,
      icon: p.icon,
      category: p.category,
      community_area: p.community_area,
      description: p.description,
      severity: p.severity,
      entity_id: p.entity_id,
    },
    geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
  };
}

function layerHref(point: MapPoint): string | null {
  if (point.entity_type === "project") return "/projects";
  if (point.entity_type === "event") return "/events";
  return null;
}

export function MapExplorer() {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const pointsById = useRef<Map<string, MapPoint>>(new Map());

  const [mapReady, setMapReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [query, setQuery] = useState("");
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MAP_LAYERS.map((l) => [l.key, l.defaultOn]))
  );
  const [showLayers, setShowLayers] = useState(false);
  const [selected, setSelected] = useState<MapPoint | null>(null);

  const pointsByIdNow = pointsById;

  // ---- load data -------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setConfigured(isSupabaseConfigured());
      const data = await fetchMapPoints();
      if (cancelled) return;
      pointsByIdNow.current = new Map(data.map((p) => [p.id, p]));
      setPoints(data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [pointsByIdNow]);

  // ---- initialise map --------------------------------------------
  useEffect(() => {
    const container = rootRef.current;
    if (!container || mapRef.current) return;
    let disposed = false;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      const { Protocol } = await import("pmtiles");
      if (disposed) return;

      const protocol = new Protocol();
      maplibregl.addProtocol("pmtiles", protocol.tile as never);

      const tilesUrl = MAP_TILES_URL.replace(/\/+$/, "");

      const style: any = tilesUrl
        ? {
            ...basemapStyle,
            sources: {
              basemap: {
                type: "vector",
                url: `pmtiles://${tilesUrl}`,
                attribution: MAP_ATTRIBUTION,
              },
            },
          }
        : {
            version: 8,
            sources: {
              basemap: {
                type: "raster",
                tiles: [OSM_RASTER_TILES],
                tileSize: 256,
                maxzoom: 18,
                attribution: MAP_ATTRIBUTION,
              },
            },
            layers: [{ id: "basemap-raster", type: "raster", source: "basemap" }],
          };

      const map = new maplibregl.Map({
        container,
        style: MAP_STYLE_URL || style,
        center: [KLAGON_CENTER.lng, KLAGON_CENTER.lat],
        zoom: KLAGON_ZOOM,
        minZoom: KLAGON_MIN_ZOOM,
        maxZoom: KLAGON_MAX_ZOOM,
        attributionControl: { compact: true },
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

      map.on("load", () => {
        // One clustered GeoJSON source + layer group per map layer.
        MAP_LAYERS.forEach((l) => {
          map.addSource(`src-${l.key}`, {
            type: "geojson",
            data: { type: "FeatureCollection", features: [] },
            cluster: true,
            clusterMaxZoom: KLAGON_CLUSTER_MAX_ZOOM,
            clusterRadius: 40,
          });

          map.addLayer({
            id: `cluster-${l.key}`,
            type: "circle",
            source: `src-${l.key}`,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": l.color,
              "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 50, 26],
              "circle-opacity": 0.88,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            },
          });

          map.addLayer({
            id: `cluster-count-${l.key}`,
            type: "symbol",
            source: `src-${l.key}`,
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["Open Sans Bold"],
              "text-size": 11,
            },
            paint: { "text-color": "#ffffff" },
          });

          map.addLayer({
            id: `points-${l.key}`,
            type: "circle",
            source: `src-${l.key}`,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": l.color,
              "circle-radius": 7,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            },
          });

          map.on("click", `points-${l.key}`, (e: any) => {
            const props = (e.features?.[0]?.properties ?? {}) as PointProps;
            const pt = pointsByIdNow.current.get(props.pid);
            if (!pt) return;
            setSelected(pt);
            map.easeTo({
              center: [pt.longitude, pt.latitude],
              zoom: Math.max(map.getZoom(), 15),
            });
          });

          map.on("click", `cluster-${l.key}`, (e: any) => {
            const geom = e.features?.[0]?.geometry as Point | undefined;
            if (!geom) return;
            const [lng, lat] = geom.coordinates;
            map.easeTo({
              center: [lng, lat],
              zoom: Math.min(map.getZoom() + 2, KLAGON_MAX_ZOOM),
            });
          });

          ["points", "cluster"].forEach((kind) => {
            map.on("mouseenter", `${kind}-${l.key}`, () => {
              map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", `${kind}-${l.key}`, () => {
              map.getCanvas().style.cursor = "";
            });
          });
        });

        mapRef.current = map;
        setMapReady(true);
      });

      map.on("error", () => {
        /* tile fetch errors are non-fatal; the map still renders */
      });
    })();

    return () => {
      disposed = true;
      setMapReady(false);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [pointsByIdNow]);

  // ---- push data into sources ------------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const sourceCount = MAP_LAYERS.filter(
      (l) => enabled[l.key] ?? l.defaultOn
    ).length;
    if (sourceCount === 0) return;

    MAP_LAYERS.forEach((l) => {
      const on = enabled[l.key] ?? l.defaultOn;
      const visible = points.filter(
        (p) => on && layerIn(l.entityTypes, p) && matchesQuery(p, query)
      );
      const src = map.getSource(`src-${l.key}`);
      if (!src) return;

      src.setData({ type: "FeatureCollection", features: visible.map(toFeature) });
      const layerIds = [
        `cluster-${l.key}`,
        `cluster-count-${l.key}`,
        `points-${l.key}`,
      ];
      layerIds.forEach((id) => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(
            id,
            "visibility",
            on && visible.length > 0 ? "visible" : "none"
          );
        }
      });
    });
  }, [points, enabled, query, mapReady]);

  // ---- deep-link / auto-select from ?point=<id> --------------------
  useEffect(() => {
    const handle = () => {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get("point");
      if (!pid) return;
      const pt = pointsByIdNow.current.get(pid);
      if (pt) setSelected(pt);
    };
    handle();
    window.addEventListener("popstate", handle);
    return () => window.removeEventListener("popstate", handle);
  }, [mapReady, pointsByIdNow]);

  // ---- derived -----------------------------------------------------
  const counts = useMemo(() => {
    const total: Record<string, number> = {};
    points.forEach((p) => {
      total[p.entity_type] = (total[p.entity_type] ?? 0) + 1;
    });
    return total;
  }, [points]);

  const selectedLayer =
    selected != null
      ? MAP_LAYERS.find((l) => l.entityTypes.includes(selected.entity_type))
      : undefined;

  const toggle = (key: string) =>
    setEnabled((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }));

  return (
    <div ref={rootRef} className="klagon-map-root">
      <div className="klagon-map-canvas" />

      {loading && (
        <div className="klagon-map-loading">
          <span className="inline-flex items-center gap-2 rounded-lg bg-white border border-border px-3 py-2 text-xs font-medium text-gray shadow-sm">
            <Loader2 size={14} className="animate-spin text-amber" />
            Loading Klagon map…
          </span>
        </div>
      )}

      {!configured && (
        <div className="klagon-map-loading">
          <span className="rounded-lg bg-white border border-border px-3 py-2 text-xs font-medium text-gray shadow-sm">
            Map data not configured yet.
          </span>
        </div>
      )}

      {/* search */}
      <div className="klagon-map-panel klagon-map-search flex items-center gap-2">
        <Search size={15} className="text-gray shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Klagon…"
          className="w-full bg-transparent text-sm text-navy placeholder:text-gray/60 focus:outline-none"
          aria-label="Search the map"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="text-gray hover:text-navy"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* layers toggle */}
      <div className="klagon-map-panel klagon-map-layers-toggle">
        <button
          onClick={() => setShowLayers((s) => !s)}
          className={`flex items-center gap-1.5 text-xs font-semibold ${
            showLayers ? "text-blue" : "text-navy"
          }`}
          aria-expanded={showLayers}
          aria-label="Toggle map layers"
        >
          <SlidersHorizontal size={14} />
          Layers
        </button>
      </div>

      {showLayers && (
        <div
          className="klagon-map-panel klagon-map-layers-panel"
          role="group"
          aria-label="Map layers"
        >
          <div className="flex flex-col gap-1">
            {MAP_LAYERS.map((l) => {
              const on = enabled[l.key] ?? l.defaultOn;
              const n = counts[l.key] ?? 0;
              return (
                <button
                  key={l.key}
                  onClick={() => toggle(l.key)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-light"
                  aria-pressed={on}
                >
                  <span
                    className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: on ? l.color : "#d8dee6" }}
                  />
                  <span className="text-xs font-medium text-navy">{l.icon} {l.label}</span>
                  <span className="ml-auto text-[10px] font-semibold text-gray">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* quick chips */}
      <div className="klagon-map-chip-row">
        {MAP_LAYERS.filter((l) => enabled[l.key] ?? l.defaultOn).map((l) => (
          <button
            key={l.key}
            className="klagon-map-chip"
            aria-pressed="true"
            onClick={() => toggle(l.key)}
          >
            <span className="klagon-map-chip-dot" style={{ backgroundColor: l.color }} />
            {l.label}
          </button>
        ))}
      </div>

      {/* selected detail card */}
      {selected && (
        <div className="klagon-map-card">
          <div className="flex items-start gap-3 p-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
              style={{ backgroundColor: `${selectedLayer?.color ?? "#eee"}22` }}
            >
              {selected.icon ?? selectedLayer?.icon ?? <MapPin size={18} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-bold text-navy">
                  {selected.name}
                </h3>
                {selected.severity && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
                    style={{
                      backgroundColor:
                        SEVERITY_META[selected.severity]?.color ?? "#DC2626",
                    }}
                  >
                    {SEVERITY_META[selected.severity]?.emoji}{" "}
                    {SEVERITY_META[selected.severity]?.label}
                  </span>
                )}
              </div>
              <p className="text-[11px] font-medium text-gray">
                {selected.category ?? selectedLayer?.label}
                {selected.community_area ? ` · ${selected.community_area}` : ""}
              </p>
              {selected.description && (
                <p className="mt-1.5 text-xs leading-relaxed text-gray">
                  {selected.description}
                </p>
              )}
              <div className="mt-3 flex items-center gap-2">
                {layerHref(selected) && (
                  <a
                    href={layerHref(selected)!}
                    className="rounded-lg bg-navy px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90"
                  >
                    Open {selectedLayer?.label ?? "page"} →
                  </a>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-semibold text-gray hover:bg-light"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function layerIn(types: MapEntityType[], p: MapPoint): boolean {
  return types.includes(p.entity_type);
}