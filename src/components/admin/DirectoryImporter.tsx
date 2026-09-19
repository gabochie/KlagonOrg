"use client";

/**
 * Business registry importer (admin only).
 *
 * Upload the DBGABOCHIE `klagon_businesses.csv` snapshot (parsed
 * in-browser, never committed). Rows gate on publishable consent +
 * identity + phone, then insert as `status = 'pending'`, tier
 * `community` — invisible until approved in Sponsors admin, claimable
 * by owners through the normal flow. Deterministic slugs make
 * re-uploads dedupe instead of doubling.
 */

import { useMemo, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import {
  parseRegistryCsv,
  validateRegistryBatch,
  type RegistryVerdict,
} from "@/lib/registryImport";

export function DirectoryImporter() {
  const [fileName, setFileName] = useState("");
  const [verdicts, setVerdicts] = useState<RegistryVerdict[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const importable = useMemo(() => verdicts.filter((v) => v.importable), [verdicts]);
  const quarantined = useMemo(() => verdicts.filter((v) => !v.importable), [verdicts]);
  const quarantineReasons = useMemo(() => {
    const m = new Map<string, number>();
    quarantined.forEach((v) => v.reasons.forEach((r) => m.set(r, (m.get(r) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [quarantined]);

  function onFile(f: File | undefined) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      setVerdicts(validateRegistryBatch(parseRegistryCsv(String(rd.result ?? ""))));
      setFileName(f.name);
      setResult(null);
    };
    rd.readAsText(f);
  }

  async function runImport() {
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) {
      setResult("Supabase is not configured.");
      return;
    }
    setBusy(true);
    setResult(null);
    const entries = importable
      .map((v) => v.entry)
      .filter((e): e is NonNullable<typeof e> => e !== null);
    const BATCH = 100;
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];
    try {
      for (let i = 0; i < entries.length; i += BATCH) {
        const chunk = entries.slice(i, i + BATCH);
        setProgress(`Checking batch ${Math.floor(i / BATCH) + 1} of ${Math.ceil(entries.length / BATCH)}…`);
        const { data: existing, error: checkError } = await c
          .from("sponsors")
          .select("slug")
          .in(
            "slug",
            chunk.map((e) => e.slug)
          );
        if (checkError) {
          errors.push(`Dedupe check failed: ${checkError.message}`);
          break;
        }
        const seen = new Set((existing ?? []).map((r) => r.slug));
        const fresh = chunk.filter((e) => {
          if (seen.has(e.slug)) {
            skipped++;
            return false;
          }
          return true;
        });
        if (fresh.length === 0) continue;
        setProgress(`Inserting ${inserted + fresh.length} of ${entries.length}…`);
        const { error } = await c.from("sponsors").insert(
          fresh.map((e) => ({
            slug: e.slug,
            tier: "community" as const,
            status: "pending" as const,
            name: e.name,
            categories: e.categories,
            products_services: e.products_services,
            contact: { phone: e.contact.phone },
            location: { area: e.location.area, address: e.location.address },
          }))
        );
        if (error) {
          errors.push(`Insert failed: ${error.message}`);
          break;
        }
        inserted += fresh.length;
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "failed");
    }
    setBusy(false);
    setProgress("");
    setResult(
      `Imported ${inserted} as pending, skipped ${skipped} duplicate(s). Approve in Sponsors admin.` +
        (errors.length > 0 ? ` Errors: ${errors.slice(0, 3).join(" | ")}` : "")
    );
    if (inserted > 0) setVerdicts([]);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="text-sm font-extrabold text-navy">Directory Importer</div>
      <div className="text-[11px] text-gray mt-0.5 mb-3">
        Registry snapshot → pending sponsors. Invisible until approved, ownable via claims.
      </div>

      {verdicts.length === 0 ? (
        <label className="block border border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-light/50">
          <div className="text-xs font-bold text-navy">Upload registry CSV</div>
          <div className="text-[11px] text-gray mt-1">
            Copy <span className="font-mono">klagon_businesses.csv</span> from your DBGABOCHIE
            checkout and upload here. Parsed in your browser.
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

          {quarantineReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quarantineReasons.map(([r, n]) => (
                <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                  {r}: {n}
                </span>
              ))}
            </div>
          )}

          <button
            disabled={busy || importable.length === 0}
            onClick={() => void runImport()}
            className="w-full px-3 py-2 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-50"
          >
            {busy ? `Working… ${progress}` : `Import ${importable.length} as Pending →`}
          </button>
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
