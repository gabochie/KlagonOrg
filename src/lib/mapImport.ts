/**
 * OSM staging importer — pure kernel.
 *
 * Turns the DBGABOCHIE `staging_tema_west_osm.csv` rows (real OpenStreetMap
 * points with coordinates) into `map_points` inserts. Every row lands as
 * `status = 'pending'`, `source = 'osm-staging'` for admin approval —
 * nothing unverified ever reaches the public map. `external_id` carries the
 * stable `osm:{osm_id}` key so re-uploads dedupe instead of doubling.
 *
 * Pure TS. Deterministic. Fully unit-tested.
 */

import type { MapEntityType } from "@/lib/map/types";

export interface RawOsmRow {
  company: string;
  record_type: string;
  osm_tag: string;
  phone: string;
  website: string;
  email: string;
  street: string;
  housenumber: string;
  osm_id: string;
  lat: string;
  lon: string;
}

export interface ValidMapPoint {
  entity_type: MapEntityType;
  /** Stable text key for imports (e.g. 'osm:way788490441'). Never the uuid entity_id. */
  external_id: string;
  name: string;
  description: string | null;
  category: string;
  latitude: number;
  longitude: number;
  community_area: string;
  dedupeKey: string;
}

export interface OsmVerdict {
  rowNumber: number;
  importable: boolean;
  point: ValidMapPoint | null;
  reasons: string[];
}

/** Tema West operating box. Outside = bad geocode, quarantine. */
export const TEMA_BBOX = {
  minLat: 5.55,
  maxLat: 5.8,
  minLon: -0.15,
  maxLon: 0.1,
};

const TAG_ENTITY: { match: RegExp; entity: MapEntityType }[] = [
  { match: /worship|church|mosque|relig/i, entity: "faith" },
  { match: /school|college|university|kindergarten/i, entity: "school" },
  { match: /hospital|clinic|pharmacy|health|doctor|dental/i, entity: "health" },
  { match: /government|police|assembly|post_office|court/i, entity: "governance" },
  { match: /fuel|bank|restaurant|bar|pub|food|retail|shop|supermarket|market|hotel|salon|pharmacy|service|store|business|eatery|bakery/i, entity: "business" },
  { match: /event|hall|centre|center/i, entity: "community" },
];

export function mapEntityType(recordType: string, osmTag: string): MapEntityType {
  const hay = `${recordType} ${osmTag}`;
  for (const { match, entity } of TAG_ENTITY) {
    if (match.test(hay)) return entity;
  }
  return "community";
}

export function parseOsmCsv(text: string): RawOsmRow[] {
  const rows: string[][] = [];
  let cur = "";
  let row: string[] = [];
  let inQ = false;
  const src = (text ?? "").replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQ) {
      if (c === '"') {
        if (src[i + 1] === '"') { cur += '"'; i++; }
        else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c === "\r") { /* skip */ }
    else cur += c;
  }
  if (cur !== "" || row.length > 0) { row.push(cur); rows.push(row); }
  const data = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  if (data.length === 0) return [];
  const head = data[0].map((h) => h.trim().toLowerCase());
  const blank: RawOsmRow = {
    company: "", record_type: "", osm_tag: "", phone: "", website: "",
    email: "", street: "", housenumber: "", osm_id: "", lat: "", lon: "",
  };
  return data.slice(1).map((cells) => {
    const out = { ...blank };
    (Object.keys(blank) as (keyof RawOsmRow)[]).forEach((k) => {
      const idx = head.indexOf(k);
      if (idx >= 0) out[k] = (cells[idx] ?? "").trim();
    });
    return out;
  });
}

export function validateOsmRow(row: RawOsmRow, rowNumber: number): OsmVerdict {
  const reasons: string[] = [];
  const name = row.company.trim();
  if (name.length < 2) reasons.push("no-name");
  if (!row.osm_id.trim()) reasons.push("no-osm-id");
  const latRaw = row.lat.trim();
  const lonRaw = row.lon.trim();
  if (!latRaw || !lonRaw) reasons.push("no-coords");
  const lat = Number(latRaw);
  const lon = Number(lonRaw);
  if (reasons.length === 0 && (!Number.isFinite(lat) || !Number.isFinite(lon))) reasons.push("no-coords");
  else if (
    reasons.length === 0 &&
    (lat < TEMA_BBOX.minLat || lat > TEMA_BBOX.maxLat ||
    lon < TEMA_BBOX.minLon || lon > TEMA_BBOX.maxLon)
  ) reasons.push("outside-tema-west");
  if (reasons.length > 0) return { rowNumber, importable: false, point: null, reasons };
  const addr = [row.street.trim(), row.housenumber.trim()].filter(Boolean).join(" ");
  const contact = [row.phone.trim(), row.website.trim(), row.email.trim()].filter(Boolean).join(" · ");
  const description = [addr, contact].filter(Boolean).join(" — ") || null;
  const communityArea = /klagon/i.test(`${name} ${addr}`) ? "Klagon" : "Greater Klagon";
  return {
    rowNumber,
    importable: true,
    point: {
      entity_type: mapEntityType(row.record_type, row.osm_tag),
      external_id: `osm:${row.osm_id.trim()}`,
      name,
      description,
      category: row.record_type.trim() || row.osm_tag.trim() || "Place",
      latitude: lat,
      longitude: lon,
      community_area: communityArea,
      dedupeKey: `osm:${row.osm_id.trim()}`,
    },
    reasons: [],
  };
}

export function validateOsmBatch(rows: RawOsmRow[]): OsmVerdict[] {
  const seen = new Set<string>();
  return rows.map((r, i) => {
    const v = validateOsmRow(r, i + 2);
    if (v.importable && v.point) {
      if (seen.has(v.point.dedupeKey)) {
        return { rowNumber: i + 2, importable: false, point: null, reasons: ["duplicate-in-file"] };
      }
      seen.add(v.point.dedupeKey);
    }
    return v;
  });
}
