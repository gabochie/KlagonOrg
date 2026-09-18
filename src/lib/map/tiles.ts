// ------------------------------------------------------------------
// Klagon Map — map configuration.
//
// Basemap strategy (decided):
//   production default -> OpenFreeMap Liberty vector style (free, no key,
//                  planet-wide OSM data WITH business/amenity POI layers).
//                  Zero setup, zero cost, policy-clean.
//   optional upgrade  -> self-hosted PMTiles extract on Cloudflare R2,
//                  served to the browser as NEXT_PUBLIC_MAP_TILES_URL.
//                  MapLibre reads it via the "pmtiles://" protocol with
//                  the bundled minimalist style.
//   optional override -> any full style.json via NEXT_PUBLIC_MAP_STYLE_URL.
//
// Precedence: MAP_STYLE_URL > R2 PMTiles > OpenFreeMap default.
// ------------------------------------------------------------------

export const KLAGON_CENTER = { lng: -0.0533245, lat: 5.6637468 }; // Klagon, Tema West, Ghana
export const KLAGON_ZOOM = 14;
export const KLAGON_MIN_ZOOM = 11;
export const KLAGON_MAX_ZOOM = 17;
export const KLAGON_CLUSTER_MAX_ZOOM = 13;

export const MAP_ATTRIBUTION = "© OpenStreetMap contributors © OpenMapTiles";

// Free vector basemap with POIs (shops, amenities, transit). No key needed.
// Served by OpenFreeMap; R2 self-hosting remains the scale-out path.
export const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

// Self-hosted PMTiles URL (R2 public bucket). Empty string => OpenFreeMap default.
export const MAP_TILES_URL = process.env.NEXT_PUBLIC_MAP_TILES_URL ?? "";

// Optional full style (protomaps / maptiler flavor). Empty => default chain.
export const MAP_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";

export function hasConfiguredTiles(): boolean {
  return MAP_TILES_URL.length > 0;
}