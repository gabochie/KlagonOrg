/**
 * Business registry importer — pure kernel.
 *
 * Turns the DBGABOCHIE Klagon registry (`klagon_businesses.csv`, 33
 * columns) into `sponsors` directory entries. Every row lands as
 * `status = 'pending'`, tier `community`, invisible until an admin
 * approves it — then the owner can claim it through the normal flow.
 * Slugs are deterministic (`slugified-name-kgb0001`) so re-uploads
 * dedupe instead of doubling. No scraped data: only rows with a
 * publishable consent basis pass the gate.
 *
 * Pure TS. Deterministic. Fully unit-tested.
 */

export interface RawRegistryRow {
  id: string;
  company: string;
  firm_name: string;
  title: string;
  contact_name: string;
  phone: string;
  email: string;
  website: string;
  region: string;
  district: string;
  location: string;
  verified_status: string;
  consent_status: string;
  opt_out_date: string;
  record_type: string;
  notes: string;
}

export interface ValidDirectoryEntry {
  slug: string;
  name: string;
  categories: string[];
  products_services: string[];
  contact: { phone: string };
  location: { area: string; address: string | null };
  sourceRecordId: string;
}

export interface RegistryVerdict {
  rowNumber: number;
  importable: boolean;
  entry: ValidDirectoryEntry | null;
  reasons: string[];
}

const ALLOWED_CONSENT = new Set(["OPTED_IN", "B2B_PUBLISHED"]);

export function slugifyCompany(company: string, recordId: string): string {
  const base =
    company
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "business";
  const suffix = recordId.trim().toLowerCase().replace(/[^a-z0-9]+/g, "") || "noid";
  return `${base}-${suffix}`;
}

function humanizeRecordType(recordType: string): string {
  const words = recordType
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.join(" ") || "Business";
}

/** Directory gate: publishable consent + identity + reachable phone. */
export function validateRegistryRow(row: RawRegistryRow, rowNumber: number): RegistryVerdict {
  const reasons: string[] = [];
  const company = (row.company || row.firm_name || "").trim();
  if (company.length < 2) reasons.push("no-company");
  if (!row.id.trim()) reasons.push("no-id");
  const consent = (row.consent_status ?? "").trim().toUpperCase();
  if (!ALLOWED_CONSENT.has(consent)) reasons.push(`bad-consent:${row.consent_status || "blank"}`);
  if ((row.opt_out_date ?? "").trim() !== "") reasons.push("opted-out");
  const digits = (row.phone ?? "").replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) reasons.push("no-phone");
  if (reasons.length > 0) return { rowNumber, importable: false, entry: null, reasons };
  const location = row.location.trim();
  const area = /klagon/i.test(`${company} ${location}`) ? "Klagon" : row.district.trim() || "Tema West";
  return {
    rowNumber,
    importable: true,
    entry: {
      slug: slugifyCompany(company, row.id),
      name: company,
      categories: [humanizeRecordType(row.record_type)],
      products_services: row.title.trim() ? [row.title.trim()] : [],
      contact: { phone: row.phone.trim() },
      location: { area, address: location || null },
      sourceRecordId: row.id.trim(),
    },
    reasons: [],
  };
}

export function validateRegistryBatch(rows: RawRegistryRow[]): RegistryVerdict[] {
  const seen = new Set<string>();
  return rows.map((r, i) => {
    const v = validateRegistryRow(r, i + 2);
    if (v.importable && v.entry) {
      if (seen.has(v.entry.slug)) {
        return { rowNumber: i + 2, importable: false, entry: null, reasons: ["duplicate-in-file"] };
      }
      seen.add(v.entry.slug);
    }
    return v;
  });
}

/** Header-tolerant CSV parser for the 33-column registry export. */
export function parseRegistryCsv(text: string): RawRegistryRow[] {
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
  const blank: RawRegistryRow = {
    id: "", company: "", firm_name: "", title: "", contact_name: "",
    phone: "", email: "", website: "", region: "", district: "",
    location: "", verified_status: "", consent_status: "", opt_out_date: "",
    record_type: "", notes: "",
  };
  return data.slice(1).map((cells) => {
    const out = { ...blank };
    (Object.keys(blank) as (keyof RawRegistryRow)[]).forEach((k) => {
      const idx = head.indexOf(k);
      if (idx >= 0) out[k] = (cells[idx] ?? "").trim();
    });
    return out;
  });
}
