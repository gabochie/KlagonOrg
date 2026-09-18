"use client";

/**
 * WhatsApp listing importer (admin only).
 *
 * Staff collect explicit opt-in listings over WhatsApp, log them into the
 * CSV template, and upload here. The kernel gates every row: only
 * OPTED_IN rows with a date and a usable phone are importable. Imports
 * land in `posts` as approved with the consent trail in `details`, and
 * per-row duplicate checks (phone + title) keep re-uploads safe.
 */

import { useMemo, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  LISTING_CSV_TEMPLATE,
  parseListingCsv,
  validateListingBatch,
  type ListingVerdict,
} from "@/lib/listingImport";

function downloadTemplate() {
  const blob = new Blob([LISTING_CSV_TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "listing-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ListingImporter() {
  const { user } = useAuth();
  const [fileName, setFileName] = useState("");
  const [verdicts, setVerdicts] = useState<ListingVerdict[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const importable = useMemo(() => verdicts.filter((v) => v.importable), [verdicts]);
  const quarantined = useMemo(() => verdicts.filter((v) => !v.importable), [verdicts]);

  function onFile(f: File | undefined) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      setVerdicts(validateListingBatch(parseListingCsv(String(rd.result ?? ""))));
      setFileName(f.name);
      setResult(null);
    };
    rd.readAsText(f);
  }

  async function runImport() {
    if (!user) {
      setResult("Sign in as admin to import.");
      return;
    }
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) {
      setResult("Supabase is not configured.");
      return;
    }
    setBusy(true);
    setResult(null);
    const batch = new Date().toISOString().slice(0, 10);
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];
    for (const v of importable) {
      const l = v.listing;
      if (!l) continue;
      try {
        const { data: existing } = await c
          .from("posts")
          .select("id")
          .eq("contact_phone", l.contact_phone)
          .eq("title", l.title)
          .limit(1);
        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }
        const { error } = await c.from("posts").insert({
          type: l.type,
          title: l.title,
          excerpt: l.excerpt,
          body: l.body,
          category: l.category,
          subcategory: l.subcategory,
          details: {
            source: "whatsapp-import",
            batch,
            consent_status: "OPTED_IN",
            consent_date: l.consent_date,
            contact_name: l.contact_name,
          },
          area: l.area,
          price_ghs: l.price_ghs,
          contact_phone: l.contact_phone,
          contact_email: l.contact_email,
          event_date: l.event_date,
          event_time: l.event_time,
          event_location: l.event_location,
          status: "approved",
          published_at: new Date().toISOString(),
          submitted_by: user.id,
          boost_tier: "none",
        });
        if (error) errors.push(`Row ${v.rowNumber}: ${error.message}`);
        else inserted++;
      } catch (e) {
        errors.push(`Row ${v.rowNumber}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
    setBusy(false);
    setResult(
      `Imported ${inserted}, skipped ${skipped} duplicate(s).` +
        (errors.length > 0 ? ` Errors: ${errors.slice(0, 3).join(" | ")}` : "")
    );
    if (inserted > 0) setVerdicts([]);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className="text-sm font-extrabold text-navy">Listing Importer</div>
          <div className="text-[11px] text-gray mt-0.5">
            WhatsApp opt-in listings only — consent gate enforced, duplicates skipped
          </div>
        </div>
        <button
          onClick={downloadTemplate}
          className="px-2.5 py-1.5 rounded-lg bg-light text-navy text-[11px] font-bold cursor-pointer hover:bg-pale"
        >
          Download CSV Template
        </button>
      </div>

      {verdicts.length === 0 ? (
        <label className="block border border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-light/50">
          <div className="text-xs font-bold text-navy">Upload listings CSV</div>
          <div className="text-[11px] text-gray mt-1">
            Use the template. Only rows with explicit OPTED_IN consent + date + phone import.
            Phone numbers never enter this repo.
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
          />
        </label>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-[11px] mb-3">
            <span className="font-bold text-navy">{fileName}</span>
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-bold">
              {importable.length} importable
            </span>
            <span className="px-2 py-0.5 rounded-full bg-pale text-navy font-bold">
              {quarantined.length} quarantined
            </span>
            <button
              onClick={() => {
                setVerdicts([]);
                setFileName("");
                setResult(null);
              }}
              className="ml-auto px-2 py-1 rounded-lg bg-light text-navy font-bold cursor-pointer hover:bg-pale"
            >
              Clear
            </button>
          </div>

          {quarantined.length > 0 && (
            <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto mb-3">
              {quarantined.slice(0, 50).map((v) => (
                <div
                  key={v.rowNumber}
                  className="rounded-lg border border-border px-3 py-2 flex items-center justify-between gap-2"
                >
                  <span className="text-[11px] font-bold text-navy">Row {v.rowNumber}</span>
                  <span className="text-[10px] text-gray">{v.reasons.join(" · ")}</span>
                </div>
              ))}
            </div>
          )}

          <button
            disabled={busy || importable.length === 0}
            onClick={() => void runImport()}
            className="w-full px-3 py-2 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {busy ? "Importing…" : `Import ${importable.length} as Approved →`}
          </button>
          <p className="text-[10px] text-gray mt-1.5">
            Imports go live immediately as approved posts with the consent trail attached.
          </p>
        </>
      )}

      {result && (
        <div className="mt-3 text-[11px] font-semibold text-navy bg-pale rounded-lg px-3 py-2">
          {result}
        </div>
      )}
    </div>
  );
}
