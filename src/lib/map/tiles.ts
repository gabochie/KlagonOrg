// ------------------------------------------------------------------
// Klagon Map — map configuration.
//
// Basemap strategy (decided):
//   production  -> self-hosted PMTiles extract on Cloudflare R2,
//                  served to the browser as
//                  NEXT_PUBLIC_MAP_TILES_URL (a .pmtiles URL).
//                  MapLibre reads it via the "pmtiles://" protocol.
//   development -> no extra setup: falls back to OSM raster tiles so
//                  `npm run dev` works before R2 is configured. The
//                  fallback is lower-res and policy-restricted — do
//                  not ship it as the production basemap.
//
// If you later host your own style.json (e.g. a full protomaps /
// maptiler style), set NEXT_PUBLIC_MAP_STYLE_URL and the style's
// sources will be used instead of the bundled minimalist style.
// ------------------------------------------------------------------

export const KLAGON_CENTER = { lng: -0.0533245, lat: 5.6637468 }; // Klagon, Tema West, Ghana
export const KLAGON_ZOOM = 14;
export const KLAGON_MIN_ZOOM = 11;
export const KLAGON_MAX_ZOOM = 17;
export const KLAGON_CLUSTER_MAX_ZOOM = 13;

export const MAP_ATTRIBUTION = "© OpenStreetMap contributors";

// Self-hosted PMTiles URL (R2 public bucket). Empty string => raster fallback.
export const MAP_TILES_URL = process.env.NEXT_PUBLIC_MAP_TILES_URL ?? "";

// Optional full style (protomaps / maptiler flavor). Empty => bundled style.
export const MAP_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";

// OSM raster fallback (dev only — see header note).
export const OSM_RASTER_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function hasConfiguredTiles(): boolean {
  return MAP_TILES_URL.length > 0;
}