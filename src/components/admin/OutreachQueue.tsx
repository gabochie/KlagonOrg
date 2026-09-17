"use client";

/**
 * WhatsApp outreach queue (admin only, semi-automated, zero-cost).
 *
 * Flow: staff uploads a CSV snapshot copied from the DBGABOCHIE checkout
 * (PII is parsed in-browser and NEVER committed to this repo) -> kernel
 * gates VERIFIED + phone + consent + STOP -> daily queue split across
 * staff numbers -> tap-to-send `wa.me` links -> outcomes logged to
 * Supabase (outreach_sends / outreach_suppressions) -> conversions land
 * in lead_captures (source 'whatsapp-outreach') and appear in LeadsList.
 */

import { useEffect, useMemo, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import {
  gateBatch,
  buildDailyQueue,
  pickTemplate,
  buildWaLink,
  parseShopCsv,
  type GateVerdict,
  type OutreachOffer,
  type RawShopRecord,
} from "@/lib/outreach";

type Outcome = "sent" | "skipped" | "failed" | "stopped" | "converted";
type LogMap = Record<string, { outcome: Outcome; at: string }>;

const LOG_KEY = "klagon.outreach.log.v1";

function loadLog(): LogMap {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) ?? "{}") as LogMap;
  } catch {
    return {};
  }
}

const reasonLabel: Record<string, string> = {
  "not-verified": "not verified",
  "no-phone": "no phone",
  "bad-consent": "consent",
  "opted-out": "opted out",
  stopped: "STOP",
};

function shortReason(r: string): string {
  const k = r.split(":")[0];
  return reasonLabel[k] ?? k;
}

export function OutreachQueue() {
  const [records, setRecords] = useState<RawShopRecord[]>([]);
  const [fileName, setFileName] = useState("");
  const [stops, setStops] = useState<Set<string>>(new Set());
  const [log, setLog] = useState<LogMap>({});
  const [tab, setTab] = useState<"queue" | "quarantine">("queue");
  const [perDay, setPerDay] = useState(200);
  const [staffCount, setStaffCount] = useState(3);
  const [mySlot, setMySlot] = useState(0);
  const [offer, setOffer] = useState<OutreachOffer>("both");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLog(loadLog());
      if (!isSupabaseConfigured()) return;
      const c = getBrowserClient();
      if (!c) return;
      const { data } = await c.from("outreach_suppressions").select("wa_phone");
      if (data) setStops(new Set(data.map((r) => r.wa_phone)));
    })();
  }, []);

  const verdicts = useMemo(() => gateBatch(records, stops), [records, stops]);
  const sendable = useMemo(() => verdicts.filter((v) => v.sendable), [verdicts]);
  const quarantined = useMemo(() => verdicts.filter((v) => !v.sendable), [verdicts]);

  const dayIndex = useMemo(() => {
    const d = new Date();
    return Math.floor(d.getTime() / 86400000);
  }, []);

  const queues = useMemo(
    () => buildDailyQueue(sendable, { perDay, staffCount, dayIndex }),
    [sendable, perDay, staffCount, dayIndex]
  );
  const myQueue = useMemo(
    () => queues[Math.min(mySlot, queues.length - 1)]?.records ?? [],
    [queues, mySlot]
  );
  const pending = useMemo(() => myQueue.filter((v) => !log[v.record.id]), [myQueue, log]);
  const doneToday = myQueue.length - pending.length;

  const quarantineReasons = useMemo(() => {
    const m: Record<string, number> = {};
    quarantined.forEach((v) => v.reasons.forEach((r) => {
      const k = shortReason(r);
      m[k] = (m[k] ?? 0) + 1;
    }));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [quarantined]);

  function persistLog(next: LogMap) {
    setLog(next);
    try {
      localStorage.setItem(LOG_KEY, JSON.stringify(next));
    } catch {
      /* storage full — Supabase remains source of truth */
    }
  }

  async function recordOutcome(v: GateVerdict, outcome: Outcome) {
    const id = v.record.id;
    setBusy(id);
    setNotice(null);
    persistLog({ ...log, [id]: { outcome, at: new Date().toISOString() } });
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (c && v.waPhone) {
      const { error } = await c.from("outreach_sends").insert({
        source_record_id: id,
        company: v.record.company || null,
        wa_phone: v.waPhone,
        staff_slot: mySlot,
        template: offer,
        area: v.area,
        outcome,
      });
      if (error) setNotice(`Logged locally; Supabase write failed: ${error.message}`);
      if (outcome === "stopped") {
        const { error: sErr } = await c
          .from("outreach_suppressions")
          .upsert({ wa_phone: v.waPhone, reason: "stop" }, { onConflict: "wa_phone" });
        if (!sErr) setStops((s) => new Set(s).add(v.waPhone as string));
        else setNotice(`Logged locally; suppression write failed: ${sErr.message}`);
      }
    }
    setBusy(null);
  }

  async function convertLead(v: GateVerdict) {
    const id = v.record.id;
    setBusy(id);
    setNotice(null);
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) {
      setNotice("Supabase not configured — conversion needs the backend. Logged locally only.");
      persistLog({ ...log, [id]: { outcome: "converted", at: new Date().toISOString() } });
      setBusy(null);
      return;
    }
    const name = v.record.contact_name || v.record.company || "WhatsApp lead";
    const { error } = await c.from("lead_captures").insert({
      name,
      phone: v.record.phone || null,
      source: "whatsapp-outreach",
      intent: `${offer} interest via WhatsApp (${v.record.company || v.record.id})`,
      status: "working",
      area: v.area,
      source_record_id: id,
    });
    if (error) {
      setNotice(`CRM insert failed: ${error.message}`);
      setBusy(null);
      return;
    }
    await recordOutcome(v, "converted");
    setNotice(`Converted: ${name} is now in AI Leads (working).`);
    setBusy(null);
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const rows = parseShopCsv(String(rd.result ?? ""));
        setRecords(rows);
        setFileName(f.name);
        setNotice(rows.length === 0 ? "No rows parsed — is this the DBGABOCHIE CSV export?" : null);
      } catch {
        setNotice("Could not parse that file. Export the CSV again from the records repo.");
      }
    };
    rd.readAsText(f);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className="text-sm font-extrabold text-navy">WhatsApp Outreach</div>
          <div className="text-[11px] text-gray mt-0.5">
            Semi-auto queue · verified records only · zero-cost tap-to-send
          </div>
        </div>
        <div className="flex gap-1.5">
          {(["queue", "quarantine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize cursor-pointer ${
                tab === t ? "bg-navy text-white" : "bg-light text-navy hover:bg-pale"
              }`}
            >
              {t === "queue" ? `Queue (${pending.length})` : `Quarantine (${quarantined.length})`}
            </button>
          ))}
        </div>
      </div>

      {records.length === 0 ? (
        <label className="block border border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-light/50">
          <div className="text-xs font-bold text-navy">Upload records snapshot (CSV)</div>
          <div className="text-[11px] text-gray mt-1">
            Copy the CSV from your DBGABOCHIE checkout and upload here. Parsed in your browser —
            phone numbers never enter this repo.
          </div>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-[11px] mb-3">
            <span className="font-bold text-navy">{fileName}</span>
            <span className="text-gray">
              {records.length} rows · {sendable.length} sendable · {quarantined.length} quarantined
            </span>
            <button
              onClick={() => { setRecords([]); setFileName(""); }}
              className="ml-auto px-2 py-1 rounded-lg bg-light text-navy font-bold cursor-pointer hover:bg-pale"
            >
              Clear
            </button>
          </div>

          {quarantineReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quarantineReasons.map(([r, n]) => (
                <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pale text-navy">
                  {r}: {n}
                </span>
              ))}
            </div>
          )}

          {tab === "queue" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                <label className="text-[11px] font-bold text-navy">
                  Per day
                  <input
                    type="number" min={10} max={600} value={perDay}
                    onChange={(e) => setPerDay(Number(e.target.value) || 200)}
                    className="mt-1 w-full rounded-lg border border-border px-2 py-1 text-xs"
                  />
                </label>
                <label className="text-[11px] font-bold text-navy">
                  Staff numbers
                  <input
                    type="number" min={1} max={10} value={staffCount}
                    onChange={(e) => { setStaffCount(Number(e.target.value) || 3); setMySlot(0); }}
                    className="mt-1 w-full rounded-lg border border-border px-2 py-1 text-xs"
                  />
                </label>
                <label className="text-[11px] font-bold text-navy">
                  My slot
                  <select
                    value={mySlot}
                    onChange={(e) => setMySlot(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border px-2 py-1 text-xs"
                  >
                    {queues.map((q) => (
                      <option key={q.staffIndex} value={q.staffIndex}>
                        #{q.staffIndex + 1} ({q.records.length} today)
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-bold text-navy">
                  Offer
                  <select
                    value={offer}
                    onChange={(e) => setOffer(e.target.value as OutreachOffer)}
                    className="mt-1 w-full rounded-lg border border-border px-2 py-1 text-xs"
                  >
                    <option value="both">Health + Setup</option>
                    <option value="health">Health Check</option>
                    <option value="sprint">Setup Sprint</option>
                  </select>
                </label>
              </div>

              <div className="text-[11px] text-gray mb-2">
                Slot #{mySlot + 1}: {doneToday}/{myQueue.length} handled today. Keep to ~20–30 sends/hour,
                business hours only.
              </div>

              <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
                {pending.length === 0 && (
                  <div className="py-6 text-center text-xs text-gray">
                    Queue clear for this slot. Pick another slot or upload a fresh snapshot.
                  </div>
                )}
                {pending.slice(0, 60).map((v) => {
                  const text = pickTemplate(v.area, offer);
                  const id = v.record.id;
                  return (
                    <div key={id} className="rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-navy truncate">
                            {v.record.company || "(no company)"}
                            <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${v.area === "klagon" ? "bg-amber/20 text-amber-800" : "bg-pale text-navy"}`}>
                              {v.area === "klagon" ? "KLAGON − discount" : "standard"}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray truncate mt-0.5">
                            {[v.record.contact_name, v.record.location].filter(Boolean).join(" · ")}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <a
                          href={v.waPhone ? buildWaLink(v.waPhone, text) : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => void recordOutcome(v, "sent")}
                          className="px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-[11px] font-bold hover:brightness-95"
                        >
                          Open in WhatsApp
                        </a>
                        <button disabled={busy === id} onClick={() => void recordOutcome(v, "skipped")} className="px-2 py-1.5 rounded-lg bg-light text-navy text-[11px] font-bold cursor-pointer hover:bg-pale disabled:opacity-50">Skip</button>
                        <button disabled={busy === id} onClick={() => void recordOutcome(v, "failed")} className="px-2 py-1.5 rounded-lg bg-light text-navy text-[11px] font-bold cursor-pointer hover:bg-pale disabled:opacity-50">Bad number</button>
                        <button disabled={busy === id} onClick={() => void recordOutcome(v, "stopped")} className="px-2 py-1.5 rounded-lg bg-light text-red-700 text-[11px] font-bold cursor-pointer hover:bg-pale disabled:opacity-50">STOP</button>
                        <button disabled={busy === id} onClick={() => void convertLead(v)} className="px-2 py-1.5 rounded-lg bg-navy text-white text-[11px] font-bold cursor-pointer hover:opacity-90 disabled:opacity-50">Convert → CRM</button>
                      </div>
                    </div>
                  );
                })}
                {pending.length > 60 && (
                  <div className="text-center text-[11px] text-gray py-2">
                    Showing first 60 of {pending.length} — work top-down to stay throttled.
                  </div>
                )}
              </div>
            </>
          )}

          {tab === "quarantine" && (
            <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto">
              <div className="text-[11px] text-gray mb-1">
                Unsendable under the verified-records gate. PENDING rows go back through the call
                verification script in DBGABOCHIE — never edit that repo from here.
              </div>
              {quarantined.slice(0, 100).map((v) => (
                <div key={v.record.id} className="rounded-lg border border-border px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-navy truncate">
                    {v.record.company || v.record.id}
                  </span>
                  <span className="text-[10px] text-gray flex-shrink-0">
                    {v.reasons.map(shortReason).join(" · ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {notice && (
        <div className="mt-3 text-[11px] font-semibold text-amber-800 bg-amber/10 rounded-lg px-3 py-2">
          {notice}
        </div>
      )}
    </div>
  );
}
