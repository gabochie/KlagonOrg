"use client";

// ------------------------------------------------------------------
// Klagon Map — MiniMap
// A small, non-interactive map for a single point. Intended for entity
// detail pages (project, event, etc.) once they add a `location`
// relationship. Rendered lazily to stay static-export safe.
// ------------------------------------------------------------------

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./map.css";

import {
  MAP_ATTRIBUTION,
  MAP_TILES_URL,
  OSM_RASTER_TILES,
} from "@/lib/map/tiles";
import type { MapPoint } from "@/lib/map/types";

interface MiniMapProps {
  point: MapPoint;
  className?: string;
}

export function MiniMap({ point, className }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    let disposed = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      const { Protocol } = await import("pmtiles");
      if (disposed) return;

      const protocol = new Protocol();
      maplibregl.addProtocol("pmtiles", protocol.tile as never);

      const tilesUrl = MAP_TILES_URL.replace(/\/+$/, "");

      const style: any = tilesUrl
        ? {
            ...(await import("./basemap-style.json")).default,
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
        style,
        center: [point.longitude, point.latitude],
        zoom: 15,
        interactive: false,
      });

      map.on("load", () => {
        map.addSource("mini-point", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                properties: {},
                geometry: {
                  type: "Point",
                  coordinates: [point.longitude, point.latitude],
                },
              },
            ],
          },
        });
        map.addLayer({
          id: "mini-marker",
          type: "circle",
          source: "mini-point",
          paint: {
            "circle-color": "#FF6B47",
            "circle-radius": 9,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 3,
          },
        });
      });

      mapRef.current = map;
    })();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [point]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-44 w-full overflow-hidden rounded-xl border border-border"}
    />
  );
}