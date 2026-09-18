"use client";

/**
 * OSM staging importer (admin only).
 *
 * Upload the DBGABOCHIE `staging_tema_west_osm.csv` snapshot (parsed
 * in-browser, never committed). Rows validate to pending `map_points`
 * with `source = 'osm-staging'` and stable `osm:{osm_id}` entity ids for
 * dedupe. Nothing reaches the public map until approved — approve the
 * batch here once spot-checked.
 */

import { useMemo, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  parseOsmCsv,
  validateOsmBatch,
  type OsmVerdict,
} from "@/lib/mapImport";

export function MapImporter() {
  const { user } = useAuth();
  const [fileName, setFileName] = useState("");
  const [verdicts, setVerdicts] = useState<OsmVerdict[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [importedIds, setImportedIds] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const importable = useMemo(() => verdicts.filter((v) => v.importable), [verdicts]);
  const quarantined = useMemo(() => verdicts.filter((v) => !v.importable), [verdicts]);
  const byEntity = useMemo(() => {
    const m = new Map<string, number>();
    importable.forEach((v) => {
      const k = v.point?.entity_type ?? "unknown";
      m.set(k, (m.get(k) ?? 0) + 1);
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [importable]);
  const quarantineReasons = useMemo(() => {
    const m = new Map<string, number>();
    quarantined.forEach((v) => v.reasons.forEach((r) => m.set(r, (m.get(r) ?? 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [quarantined]);

  function onFile(f: File | undefined) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      setVerdicts(validateOsmBatch(parseOsmCsv(String(rd.result ?? ""))));
      setFileName(f.name);
      setImportedIds([]);
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
    setProgress("Starting…");
    const points = importable
      .map((v) => v.point)
      .filter((p): p is NonNullable<typeof p> => p !== null);
    const BATCH = 100;
    let inserted = 0;
    let skipped = 0;
    const ids: string[] = [];
    const errors: string[] = [];
    try {
      for (let i = 0; i < points.length; i += BATCH) {
        const chunk = points.slice(i, i + BATCH);
        setProgress(`Checking batch ${Math.floor(i / BATCH) + 1} of ${Math.ceil(points.length / BATCH)}…`);
        const { data: existing, error: checkError } = await c
          .from("map_points")
          .select("entity_id")
          .in(
            "entity_id",
            chunk.map((p) => p.entity_id)
          );
        if (checkError) {
          errors.push(`Dedupe check failed: ${checkError.message}`);
          break;
        }
        const seen = new Set((existing ?? []).map((r) => r.entity_id));
        const fresh = chunk.filter((p) => {
          if (seen.has(p.entity_id)) {
            skipped++;
            return false;
          }
          return true;
        });
        if (fresh.length === 0) continue;
        setProgress(`Inserting ${inserted + fresh.length} of ${points.length}…`);
        const { data, error } = await c
          .from("map_points")
          .insert(
            fresh.map((p) => ({
              entity_type: p.entity_type,
              entity_id: p.entity_id,
              name: p.name,
              description: p.description,
              category: p.category,
              latitude: p.latitude,
              longitude: p.longitude,
              community_area: p.community_area,
              source: "osm-staging",
              status: "pending",
              reported_by: user.id,
            }))
          )
          .select("id");
        if (error) {
          errors.push(`Insert failed: ${error.message}`);
          break;
        }
        inserted += data?.length ?? 0;
        (data ?? []).forEach((r) => ids.push(r.id));
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : "failed");
    }
    setBusy(false);
    setProgress("");
    setImportedIds(ids);
    setResult(
      `Imported ${inserted} as pending, skipped ${skipped} duplicate(s).` +
        (errors.length > 0 ? ` Errors: ${errors.slice(0, 3).join(" | ")}` : "")
    );
  }

  async function approveBatch() {
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c || importedIds.length === 0) return;
    setBusy(true);
    const { error } = await c
      .from("map_points")
      .update({ status: "approved" })
      .in("id", importedIds);
    setBusy(false);
    setResult(
      error
        ? `Approve failed: ${error.message}`
        : `${importedIds.length} points approved — live on /map now.`
    );
    if (!error) setImportedIds([]);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="text-sm font-extrabold text-navy">Map Points Importer</div>
      <div className="text-[11px] text-gray mt-0.5 mb-3">
        OSM staging snapshot → pending review → approve. Unverified rows never go public.
      </div>

      {verdicts.length === 0 ? (
        <label className="block border border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-light/50">
          <div className="text-xs font-bold text-navy">Upload staging CSV</div>
          <div className="text-[11px] text-gray mt-1">
            Copy <span className="font-mono">staging_tema_west_osm.csv</span> from your DBGABOCHIE
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
                setImportedIds([]);
                setResult(null);
              }}
              className="ml-auto px-2 py-1 rounded-lg bg-light text-navy font-bold cursor-pointer hover:bg-pale"
            >
              Clear
            </button>
          </div>

          {byEntity.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {byEntity.map(([e, n]) => (
                <span key={e} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pale text-navy">
                  {e}: {n}
                </span>
              ))}
            </div>
          )}
          {quarantineReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quarantineReasons.map(([r, n]) => (
                <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700">
                  {r}: {n}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              disabled={busy || importable.length === 0}
              onClick={() => void runImport()}
              className="flex-1 px-3 py-2 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {busy ? `Working… ${progress}` : `Import ${importable.length} as Pending →`}
            </button>
            <button
              disabled={busy || importedIds.length === 0}
              onClick={() => void approveBatch()}
              className="flex-1 px-3 py-2 rounded-lg bg-amber text-navy text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              Approve {importedIds.length} Imported →
            </button>
          </div>
          <p className="text-[10px] text-gray mt-1.5">
            Spot-check a few names against real Klagon before approving — OSM data can be stale.
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
