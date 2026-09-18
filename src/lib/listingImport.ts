/**
 * WhatsApp listing importer — pure kernel.
 *
 * Staff collect real opt-in listings over WhatsApp (landlord/shop says yes,
 * gives details + phone), log them into the CSV template, and upload the
 * file in /dashboard/admin. This kernel validates every row and enforces
 * the consent gate: only explicit OPTED_IN rows are importable. Everything
 * else is quarantined with reasons — mirroring the outreach gate, so no
 * scraped or cold-contact data can ever enter the marketplace.
 *
 * CSV columns (header row required):
 *   type, category, subcategory, title, excerpt, body, price_ghs, area,
 *   contact_name, contact_phone, contact_email,
 *   event_date, event_time, event_location,
 *   consent_status, consent_date, source, notes
 *
 * Pure TS. Deterministic. Fully unit-tested.
 */

import type { PostArea, PostType } from "@/types";

export interface RawListingRow {
  type: string;
  category: string;
  subcategory: string;
  title: string;
  excerpt: string;
  body: string;
  price_ghs: string;
  area: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  event_date: string;
  event_time: string;
  event_location: string;
  consent_status: string;
  consent_date: string;
  source: string;
  notes: string;
}

export interface ValidListing {
  type: PostType;
  category: string;
  subcategory: string | null;
  title: string;
  excerpt: string | null;
  body: string | null;
  price_ghs: number | null;
  area: PostArea;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  event_date: string | null;
  event_time: string | null;
  event_location: string | null;
  consent_date: string;
  source: string;
  dedupeKey: string;
}

export interface ListingVerdict {
  rowNumber: number;
  importable: boolean;
  listing: ValidListing | null;
  reasons: string[];
}

const ALLOWED_TYPES: PostType[] = ["news", "event", "business", "classified", "job", "announcement"];
const ALLOWED_AREAS: PostArea[] = ["klagon", "tema_west", "other"];

/** Consent gate: explicit opt-in only. Scraped / cold / blank consent never passes. */
export function consentPasses(raw: string): boolean {
  return raw.trim().toUpperCase() === "OPTED_IN";
}

/** Normalize to wa.me-ready digits, or null when unusable. */
export function normalizeListingPhone(raw: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  if (digits.length === 10 && digits.startsWith("0")) return "233" + digits.slice(1);
  if (digits.length === 9) return "233" + digits;
  return digits;
}

/** Stable cross-batch identity: normalized phone + normalized title. */
export function dedupeKeyFor(phone: string, title: string): string {
  const t = title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `${phone}::${t}`;
}

export function validateListingRow(row: RawListingRow, rowNumber: number): ListingVerdict {
  const reasons: string[] = [];
  const type = row.type.trim().toLowerCase() as PostType;
  if (!ALLOWED_TYPES.includes(type)) reasons.push(`bad-type:${row.type || "blank"}`);
  const area = row.area.trim().toLowerCase() as PostArea;
  if (!ALLOWED_AREAS.includes(area)) reasons.push(`bad-area:${row.area || "blank"}`);
  const title = row.title.trim();
  if (title.length < 5) reasons.push("title-too-short");
  if (!consentPasses(row.consent_status)) reasons.push(`no-consent:${row.consent_status || "blank"}`);
  if (!row.consent_date.trim()) reasons.push("consent-date-missing");
  const waPhone = normalizeListingPhone(row.contact_phone);
  if (!waPhone) reasons.push("no-phone");
  let price: number | null = null;
  if (row.price_ghs.trim() !== "") {
    const n = Number(row.price_ghs);
    if (!Number.isFinite(n) || n < 0) reasons.push(`bad-price:${row.price_ghs}`);
    else price = n;
  }
  if (reasons.length > 0) return { rowNumber, importable: false, listing: null, reasons };
  return {
    rowNumber,
    importable: true,
    listing: {
      type,
      category: row.category.trim() || "General",
      subcategory: row.subcategory.trim() || null,
      title,
      excerpt: row.excerpt.trim() || null,
      body: row.body.trim() || null,
      price_ghs: price,
      area,
      contact_name: row.contact_name.trim() || "Poster",
      contact_phone: row.contact_phone.trim(),
      contact_email: row.contact_email.trim() || null,
      event_date: row.event_date.trim() || null,
      event_time: row.event_time.trim() || null,
      event_location: row.event_location.trim() || null,
      consent_date: row.consent_date.trim(),
      source: row.source.trim() || "whatsapp",
      dedupeKey: dedupeKeyFor(waPhone as string, title),
    },
    reasons: [],
  };
}

export function validateListingBatch(rows: RawListingRow[]): ListingVerdict[] {
  return rows.map((r, i) => validateListingRow(r, i + 2));
}

/** Minimal quoted-CSV parser (same rules as the outreach kernel). */
export function parseListingCsv(text: string): RawListingRow[] {
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
  const blank: RawListingRow = {
    type: "", category: "", subcategory: "", title: "", excerpt: "", body: "",
    price_ghs: "", area: "", contact_name: "", contact_phone: "", contact_email: "",
    event_date: "", event_time: "", event_location: "",
    consent_status: "", consent_date: "", source: "", notes: "",
  };
  return data.slice(1).map((cells) => {
    const out = { ...blank };
    (Object.keys(blank) as (keyof RawListingRow)[]).forEach((k) => {
      const idx = head.indexOf(k);
      if (idx >= 0) out[k] = (cells[idx] ?? "").trim();
    });
    return out;
  });
}

export const LISTING_CSV_TEMPLATE =
  "type,category,subcategory,title,excerpt,body,price_ghs,area,contact_name,contact_phone,contact_email,event_date,event_time,event_location,consent_status,consent_date,source,notes\n" +
  'classified,Properties,House,"3-bed house for rent, Klagon","Fenced 3-bed with visitors washroom","Full description here: rooms, water, parking, terms.",2500,klagon,Ama Landlady,0244123456,,,,,OPTED_IN,2026-09-18,whatsapp,"Agreed on WhatsApp Sep 18"\n';
