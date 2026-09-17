/**
 * import-verified-leads.cjs — READ-ONLY snapshot helper for WhatsApp outreach.
 *
 * Reads CSV exports COPIED from a DBGABOCHIE checkout (paths passed as args),
 * applies the same verified-records gate as src/lib/outreach.ts, and prints
 * a quarantine report. Optionally writes a sendable-only snapshot JSON for
 * upload into /dashboard/admin > WhatsApp Outreach.
 *
 * NEVER touches git, NEVER writes to DBGABOCHIE. Phone numbers stay out of
 * this repo unless you explicitly write a snapshot file — prefer uploading
 * the CSV directly in the admin UI instead.
 *
 * Usage:
 *   node scripts/import-verified-leads.cjs <klagon.csv> [master.csv] [--out snapshot.json] [--stops stops.csv]
 */

const fs = require("fs");

function parseCsv(text) {
  const rows = [];
  let cur = "", row = [], inQ = false;
  const src = String(text ?? "").replace(/^\uFEFF/, "");
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
  const data = rows.filter((r) => r.some((x) => x.trim() !== ""));
  if (!data.length) return [];
  const head = data[0].map((h) => h.trim());
  return data.slice(1).map((cells) => {
    const o = {};
    head.forEach((h, i) => { o[h] = (cells[i] ?? "").trim(); });
    return o;
  });
}

function normalizePhone(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15) return null;
  if (digits.length === 10 && digits.startsWith("0")) return "233" + digits.slice(1);
  if (digits.length === 9) return "233" + digits;
  return digits;
}

const ALLOWED = new Set(["OPTED_IN", "B2B_PUBLISHED"]);

function main() {
  const args = process.argv.slice(2);
  const files = args.filter((a) => !a.startsWith("--"));
  const outIdx = args.indexOf("--out");
  const outFile = outIdx >= 0 ? args[outIdx + 1] : null;
  const stopsIdx = args.indexOf("--stops");
  const stops = new Set();
  if (stopsIdx >= 0 && args[stopsIdx + 1]) {
    parseCsv(fs.readFileSync(args[stopsIdx + 1], "utf8")).forEach((r) => {
      const p = normalizePhone(r.wa_phone || r.phone || "");
      if (p) stops.add(p);
    });
  }
  if (!files.length) {
    console.error("Usage: node scripts/import-verified-leads.cjs <csv...> [--out snapshot.json] [--stops stops.csv]");
    process.exit(1);
  }
  const seen = new Set();
  const sendable = [];
  const quarantine = {};
  const bump = (k) => { quarantine[k] = (quarantine[k] || 0) + 1; };
  files.forEach((f) => {
    parseCsv(fs.readFileSync(f, "utf8")).forEach((r) => {
      const verified = String(r.verified_status || "").trim().toUpperCase() === "VERIFIED";
      const wa = normalizePhone(r.phone || "");
      const consent = String(r.consent_status || "").trim().toUpperCase();
      const problems = [];
      if (!verified) problems.push("not-verified");
      if (!wa) problems.push("no-phone");
      if (!ALLOWED.has(consent)) problems.push("bad-consent");
      if (String(r.opt_out_date || "").trim() !== "") problems.push("opted-out");
      if (wa && stops.has(wa)) problems.push("stopped");
      if (wa && seen.has(wa)) problems.push("duplicate");
      if (problems.length) { problems.forEach(bump); return; }
      seen.add(wa);
      sendable.push({
        id: r.id, company: r.company, contact_name: r.contact_name,
        phone: r.phone, location: r.location, district: r.district,
        region: r.region, record_type: r.record_type,
      });
    });
  });
  console.log(JSON.stringify({
    inputs: files, rows_sendable: sendable.length, quarantine, stops_loaded: stops.size,
  }, null, 1));
  if (outFile) {
    fs.writeFileSync(outFile, JSON.stringify({
      generated_at: new Date().toISOString(), source: "DBGABOCHIE snapshot (read-only)", records: sendable,
    }, null, 1));
    console.log("wrote " + outFile + " — upload it in /dashboard/admin, or better: upload the raw CSV there directly.");
  }
}

main();
