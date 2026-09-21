/**
 * KLAGON WhatsApp outreach — shared pure kernel.
 *
 * Zero-cost, semi-automated outreach over verified shop records that live in
 * the DBGABOCHIE repo (read-only snapshot, never written back):
 *
 *   1. GATE  — only VERIFIED + phone + allowed consent + not opted-out/STOP
 *              records are sendable. Everything else is quarantined with reasons.
 *   2. QUEUE — deterministic daily split across staff numbers (cap/day),
 *              business-hours friendly, round-robin rotation per day.
 *   3. SEND  — zero-cost `wa.me` tap-to-send links. Staff taps Send in the
 *              browser / WhatsApp Business app. No API, no ban wave.
 *              For hands-free runs, export an auto-batch (step 3b) for the
 *              private browser extension in tools/wa-auto-sender, then
 *              import its sender log to reconcile outcomes.
 *   4. CRM   — replies that convert become `lead_captures` rows
 *              (source 'whatsapp-outreach') on the admin side.
 *
 * Pure TS, no React, no Supabase. Deterministic. Fully unit-tested.
 */

export interface RawShopRecord {
  id: string;
  company: string;
  contact_name: string;
  phone: string;
  location: string;
  district: string;
  region: string;
  verified_status: string;
  consent_status: string;
  opt_out_date: string;
  record_type: string;
}

export type OutreachArea = "klagon" | "standard";
export type OutreachOffer = "health" | "sprint" | "both";

export interface GateVerdict {
  record: RawShopRecord;
  sendable: boolean;
  /** wa.me-ready digits when sendable, else null. */
  waPhone: string | null;
  area: OutreachArea;
  reasons: string[];
}

const ALLOWED_CONSENT = new Set(["OPTED_IN", "B2B_PUBLISHED"]);

/** Normalize a raw phone to wa.me-ready digits, or null when unusable. */
export function normalizePhone(raw: string): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  // Ghana local formats -> E.164 without '+'.
  if (digits.length === 10 && digits.startsWith("0")) return "233" + digits.slice(1);
  if (digits.length === 9) return "233" + digits;
  return digits;
}

/** Klagon shops get the founding-discount variant; everyone else standard. */
export function detectArea(r: Pick<RawShopRecord, "location" | "district" | "region">): OutreachArea {
  const s = `${r.location ?? ""} ${r.district ?? ""} ${r.region ?? ""}`.toLowerCase();
  return s.includes("klagon") ? "klagon" : "standard";
}

export function gateRecord(r: RawShopRecord, stops: Set<string>): GateVerdict {
  const reasons: string[] = [];
  const area = detectArea(r);
  const verified = (r.verified_status ?? "").trim().toUpperCase() === "VERIFIED";
  if (!verified) reasons.push(`not-verified:${r.verified_status || "blank"}`);
  const waPhone = normalizePhone(r.phone ?? "");
  if (!waPhone) reasons.push("no-phone");
  const consent = (r.consent_status ?? "").trim().toUpperCase();
  if (!ALLOWED_CONSENT.has(consent)) reasons.push(`bad-consent:${r.consent_status || "blank"}`);
  if ((r.opt_out_date ?? "").trim() !== "") reasons.push("opted-out");
  if (waPhone && stops.has(waPhone)) reasons.push("stopped");
  return { record: r, sendable: reasons.length === 0, waPhone: reasons.length === 0 ? waPhone : null, area, reasons };
}

export function gateBatch(records: RawShopRecord[], stops: Set<string>): GateVerdict[] {
  return records.map((r) => gateRecord(r, stops));
}

/**
 * Claim-drive gate. Unlike the sales gate it does NOT require VERIFIED —
 * its whole job is reaching unverified registry shops (pending + phone)
 * to verify and claim them in one motion. Consent + opt-out rules are
 * identical: B2B published contacts with a working opt-out only.
 */
export function gateClaimRecord(r: RawShopRecord, stops: Set<string>): GateVerdict {
  const reasons: string[] = [];
  const area = detectArea(r);
  const waPhone = normalizePhone(r.phone ?? "");
  if (!waPhone) reasons.push("no-phone");
  const consent = (r.consent_status ?? "").trim().toUpperCase();
  if (!ALLOWED_CONSENT.has(consent)) reasons.push(`bad-consent:${r.consent_status || "blank"}`);
  if ((r.opt_out_date ?? "").trim() !== "") reasons.push("opted-out");
  if (waPhone && stops.has(waPhone)) reasons.push("stopped");
  if (!(r.company ?? "").trim()) reasons.push("no-company");
  return { record: r, sendable: reasons.length === 0, waPhone: reasons.length === 0 ? waPhone : null, area, reasons };
}

export function gateClaimBatch(records: RawShopRecord[], stops: Set<string>): GateVerdict[] {
  return records.map((r) => gateClaimRecord(r, stops));
}

/** Claim-drive message: names the shop, offers the free profile + claim path. */
export function pickClaimTemplate(area: OutreachArea, company: string): string {
  const head = "Hello, this is KLAGON (Klagon, Tema) — the community platform for local business.";
  const shop = (company ?? "").trim() || "your shop";
  const perk = area === "klagon"
    ? "Klagon shops get a founding rate on everything"
    : "free to join";
  const tail = "Reply STOP to opt out.";
  return `${head} ${shop} can have a free verified profile, customer reviews, and a spot on our map — ${perk}. Reply CLAIM and we will set it up with you this week. ${tail}`;
}

export interface DedupeResult {
  /** One verdict per phone number (first record id wins, deterministic). */
  unique: GateVerdict[];
  /** Dropped verdicts: same phone already covered by the kept record. */
  duplicates: { keptId: string; dropped: GateVerdict }[];
}

/**
 * Phone-keyed dedupe. Shops sharing one number (branches, same owner —
 * e.g. KGB0183/KGB0185) are sent once. Operates on sendable verdicts;
 * sort by record id so the winner is stable across runs.
 */
export function dedupeByPhone(sendable: GateVerdict[]): DedupeResult {
  const sorted = [...sendable].sort((a, b) => a.record.id.localeCompare(b.record.id));
  const seen = new Map<string, GateVerdict>();
  const duplicates: DedupeResult["duplicates"] = [];
  for (const v of sorted) {
    const key = v.waPhone as string;
    const kept = seen.get(key);
    if (kept) duplicates.push({ keptId: kept.record.id, dropped: v });
    else seen.set(key, v);
  }
  return { unique: [...seen.values()], duplicates };
}

/** First cold message. Always carries identity + opt-out (consent basis). */
export function pickTemplate(area: OutreachArea, offer: OutreachOffer): string {
  const health = area === "klagon" ? "GH₵150 (Klagon founding rate)" : "GH₵250";
  const sprint = area === "klagon" ? "GH₵300 (Klagon founding rate)" : "GH₵450";
  const head = "Hello, this is KLAGON (Klagon, Tema) — we help local shops get found on Google + sell on WhatsApp.";
  const tail = "Reply STOP to opt out.";
  if (offer === "health")
    return `${head} Our Digital Health Check scores your shop 0-100 with 3 fixes: ${health}. Want the 15-min intake? ${tail}`;
  if (offer === "sprint")
    return `${head} Our 1-hour Google + WhatsApp Setup Sprint (profile claimed, catalogue, greeting, quick replies): ${sprint}. Want a slot? ${tail}`;
  return `${head} This week: Digital Health Check ${health}, or 1-hour Google + WhatsApp Setup ${sprint}. Reply HEALTH or SETUP and your shop name. ${tail}`;
}

export function buildWaLink(waPhone: string, text: string): string {
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`;
}

// ------------------------------------------------------------------
// 3b. browser auto-batch (private extension in tools/wa-auto-sender)
// ------------------------------------------------------------------

export interface AutoBatchItem {
  /** Source record id — the join key for reconciling the sender log. */
  id: string;
  waPhone: string;
  text: string;
  company: string;
}

export interface AutoBatch {
  version: 1;
  exportedAt: string;
  template: string;
  items: AutoBatchItem[];
}

export type SenderStatus = "sent" | "failed" | "skipped";

export interface SenderLogEntry {
  id: string;
  status: SenderStatus;
  at: string;
}

/**
 * Export gated, sendable verdicts as an auto-batch for the browser
 * extension. Only verdicts with a waPhone are included — the gate is
 * the consent boundary, never the extension.
 */
export function buildAutoBatch(
  verdicts: GateVerdict[],
  pickText: (v: GateVerdict) => string,
  template: string
): AutoBatch {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    template,
    items: verdicts
      .filter((v) => v.sendable && v.waPhone)
      .map((v) => ({
        id: v.record.id,
        waPhone: v.waPhone as string,
        text: pickText(v),
        company: v.record.company || "",
      })),
  };
}

const SENDER_STATUSES: ReadonlySet<string> = new Set(["sent", "failed", "skipped"]);

/**
 * Parse + validate a sender log produced by the browser extension.
 * Malformed entries are dropped, never trusted blindly.
 */
export function parseSenderLog(raw: unknown): SenderLogEntry[] {
  if (!raw || typeof raw !== "object") return [];
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items)) return [];
  const out: SenderLogEntry[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const { id, status, at } = it as Record<string, unknown>;
    if (typeof id !== "string" || id.trim() === "") continue;
    if (typeof status !== "string" || !SENDER_STATUSES.has(status)) continue;
    out.push({ id, status: status as SenderStatus, at: typeof at === "string" ? at : "" });
  }
  return out;
}

export interface StaffQueue {
  staffIndex: number;
  records: GateVerdict[];
}

/**
 * Deterministic daily queue. Sorted by record id for stability, rotated by
 * dayIndex so no shop is always first, capped at perDay, dealt round-robin
 * across staffCount numbers.
 */
export function buildDailyQueue(
  sendable: GateVerdict[],
  opts: { perDay: number; staffCount: number; dayIndex: number }
): StaffQueue[] {
  const { perDay, staffCount, dayIndex } = opts;
  const n = Math.max(1, Math.floor(staffCount));
  const cap = Math.max(0, Math.floor(perDay));
  const sorted = [...sendable].sort((a, b) => a.record.id.localeCompare(b.record.id));
  const rotated = sorted.length === 0 ? sorted : [...sorted.slice(dayIndex % sorted.length), ...sorted.slice(0, dayIndex % sorted.length)];
  const today = rotated.slice(0, cap);
  const queues: StaffQueue[] = Array.from({ length: n }, (_, i) => ({ staffIndex: i, records: [] }));
  today.forEach((v, i) => queues[i % n].records.push(v));
  return queues;
}

/** STOP / opt-out intent in a reply (case-insensitive, word-boundary). */
export function isStopReply(text: string): boolean {
  return /\bstop\b|\bopt[\s-]?out\b|\bunsubscribe\b|\bremove me\b/i.test(text ?? "");
}

/** Minimal quoted-CSV parser (handles the DBGABOCHIE exports, no deps). */
export function parseShopCsv(text: string): RawShopRecord[] {
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
  const data = rows.filter((r) => r.some((c) => c.trim() !== ""));
  if (data.length === 0) return [];
  const head = data[0].map((h) => h.trim());
  const idx = (name: string) => head.indexOf(name);
  return data.slice(1).map((cells) => {
    const get = (name: string) => {
      const i = idx(name);
      return i >= 0 ? (cells[i] ?? "").trim() : "";
    };
    return {
      id: get("id"),
      company: get("company"),
      contact_name: get("contact_name"),
      phone: get("phone"),
      location: get("location"),
      district: get("district"),
      region: get("region"),
      verified_status: get("verified_status"),
      consent_status: get("consent_status"),
      opt_out_date: get("opt_out_date"),
      record_type: get("record_type"),
    };
  });
}
