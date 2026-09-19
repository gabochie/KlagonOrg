// Build the business directory snapshot for /business.
//
// Sources:
//   1. klagon_businesses.csv  — the canonical 740-record Klagon registry (05-REPORTS / 01-DATA/directory).
//   2. klagon_maps_census.csv — Google Maps census, enriches ratings, WhatsApp numbers,
//      websites, price, hours and maps links by registry_id (then by normalized name).
//
// Output: src/data/business-directory.json (committed; used by the /business page).
// The directory stays honest: records keep a source field + verified / phone-verified flags.
//
// Run:  node scripts/build-directory.cjs
// Override inputs with env vars KLAGON_DIRECTORY_CSV and KLAGON_CENSUS_CSV.
// Injects into `npm run build` ? No — generated offline, committed, refreshed on demand.

const fs = require("fs");
const path = require("path");

const DEFAULT_DIRECTORY_CSV = process.env.KLAGON_DIRECTORY_CSV || "C:\\Users\\user\\Desktop\\GABOCHIE CORP\\KLAGON OPERATIONS\\Klagon Google Maps Directory Database\\Klagon Contacts WhatsApp\\01-DATA\\directory\\klagon_businesses.csv";
const DEFAULT_CENSUS_CSV = process.env.KLAGON_CENSUS_CSV || "C:\\Users\\user\\Desktop\\GABOCHIE CORP\\KLAGON OPERATIONS\\Klagon Google Maps Directory Database\\03-MAPS-SCRAPER\\merged\\klagon_maps_census.csv";
const OUT = path.resolve(__dirname, "../src/data/business-directory.json");

function parseCsv(text) {
  const rows = [];
  let cur = "";
  let row = [];
  let inQ = false;
  const src = (text || "").replace(/^\uFEFF/, "");
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
  return data.slice(1).map((cells) => {
    const out = {};
    head.forEach((h, idx) => { out[h] = (cells[idx] ?? "").trim(); });
    return out;
  });
}

function humanize(raw) {
  return (raw || "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ") || "Business";
}

function digitsOnly(v) {
  return (v || "").replace(/\D/g, "");
}

function formatGhanaPhone(raw) {
  let d = digitsOnly(raw);
  if (!d) return null;
  if (!d.startsWith("233")) {
    if (d.startsWith("0")) d = "233" + d.slice(1);
    else d = "233" + d;
  }
  if (d.length < 12) return null;
  const national = d.slice(3);
  if (national.length === 9) return `+233 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
  if (national.length === 8) return `+233 ${national.slice(0, 4)} ${national.slice(4)}`;
  if (national.length === 7) return `+233 ${national.slice(0, 3)} ${national.slice(3)}`;
  return `+233 ${national}`;
}

function normKey(name) {
  return (name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .filter((w) => !["ltd", "limited", "ghana", "klagon", "company", "comp", "enterprise", "enterprises", "the", "and"].includes(w))
    .join(" ");
}

function cleanWebsite(url) {
  if (!url) return null;
  const v = url.trim();
  if (!v || /ENOTFOUND/i.test(v) || /^https?:\/\//i.test(v) === false && !/^www\./i.test(v)) {
    return /ENOTFOUND/i.test(v) ? null : (/\.[a-z]{2,}/i.test(v) ? v : null);
  }
  return v;
}

function main() {
  const dirCsv = DEFAULT_DIRECTORY_CSV;
  const cenCsv = DEFAULT_CENSUS_CSV;
  if (!fs.existsSync(dirCsv) || !fs.existsSync(cenCsv)) {
    console.error(`Missing input. Set KLAGON_DIRECTORY_CSV and KLAGON_CENSUS_CSV.\n  directory: ${dirCsv}\n  census:    ${cenCsv}`);
    process.exitCode = 1;
    return;
  }

  const registry = parseCsv(fs.readFileSync(dirCsv, "utf8"));
  const census = parseCsv(fs.readFileSync(cenCsv, "utf8"));

  // Census lookup by registry_id first, then by normalized name.
  const byId = new Map();
  const byName = new Map();
  for (const r of census) {
    if (r.registry_id) {
      if (!byId.has(r.registry_id)) byId.set(r.registry_id, r);
    } else {
      const key = normKey(r.title || r.name || "");
      if (key && !byName.has(key)) byName.set(key, r);
    }
  }

  const businesses = registry
    .map((r) => {
      const id = r.id || "";
      const name = (r.company || r.firm_name || "").trim();
      const censusRow = byId.get(id) || byName.get(normKey(name) || "") || null;

      const rawPhone = r.phone || (censusRow ? censusRow.phone_normalized || censusRow.phone_raw : "") || "";
      const display = formatGhanaPhone(rawPhone);
      const waDigits = digitsOnly(censusRow ? censusRow.wa_number : null) || digitsOnly(rawPhone) || null;
      const title = (r.title || censusRow?.category || "").trim();
      const category = humanize(r.record_type);
      const area = (() => {
        const base = r.location;
        if (base) return base;
        return censusRow?.complete_address || censusRow?.address || "Klagon, Tema";
      })();

      return {
        id,
        name,
        category,
        title,
        area,
        phone: display,
        tel: digitsOnly(display) || null,
        wa: waDigits,
        website: cleanWebsite(r.website || censusRow?.website || ""),
        rating: censusRow && parseFloat(censusRow.rating) > 0 ? parseFloat(censusRow.rating) : null,
        reviews: censusRow && parseInt(censusRow.review_count, 10) > 0 ? parseInt(censusRow.review_count, 10) : null,
        price: censusRow?.price_range || null,
        hours: censusRow?.open_hours || null,
        maps: censusRow?.maps_link || null,
        lat: censusRow && censusRow.latitude ? parseFloat(censusRow.latitude) : null,
        lng: censusRow && censusRow.longitude ? parseFloat(censusRow.longitude) : null,
        verified: (r.verified_status || "").toUpperCase() === "VERIFIED",
        phoneVerified: ["VERIFIED", "PHONE_VALID"].includes((r.verified_status || "").toUpperCase()),
        hasConsent: (r.consent_status || "").toUpperCase() === "OPTED_IN" || (r.consent_status || "").toUpperCase() === "B2B_PUBLISHED",
      };
    })
    .filter((b) => b.name);

  const categoryCounts = new Map();
  businesses.forEach((b) => categoryCounts.set(b.category, (categoryCounts.get(b.category) || 0) + 1));
  const categories = [...categoryCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  const out = {
    builtAt: new Date().toISOString(),
    note: "Snapshot from klagon_businesses.csv (registry) enriched with klagon_maps_census.csv (Google Maps). Refresh with scripts/build-directory.cjs.",
    stats: {
      total: businesses.length,
      withPhone: businesses.filter((b) => b.phone).length,
      withWhatsApp: businesses.filter((b) => b.wa).length,
      withRating: businesses.filter((b) => b.rating != null).length,
      verified: businesses.filter((b) => b.verified).length,
      phoneVerified: businesses.filter((b) => b.phoneVerified).length,
      categories: categoryCounts.size,
    },
    categories,
    businesses,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(`Wrote ${OUT}`);
  console.log(`  businesses: ${out.stats.total} (${out.stats.withPhone} phone, ${out.stats.withWhatsApp} WhatsApp, ${out.stats.withRating} rated, ${out.stats.verified} verified)`);
  console.log(`  categories: ${out.stats.categories}`);
}

main();