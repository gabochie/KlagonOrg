"use client";

import { useEffect, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import type { Database } from "@/lib/database.types";

type LeadRow = Database["public"]["Tables"]["lead_captures"]["Row"];

const sourceColor: Record<string, string> = {
  "voice-agent": "bg-blue/10 text-blue-800",
  "chat-agent": "bg-amber/10 text-amber-800",
  website: "bg-pale text-blue-800",
};

export function LeadsList() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      const c = getBrowserClient();
      if (!c) {
        setLoading(false);
        return;
      }
      const { data, error } = await c
        .from("lead_captures")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      if (!error && data) setLeads(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-extrabold text-navy">AI Leads</div>
          <div className="text-[11px] text-gray mt-0.5">Captured by Ama, the sales agent</div>
        </div>
        <span className="text-[10px] font-bold tracking-widest uppercase text-navy/40">
          {leads.length} total
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray font-semibold">Loading leads…</div>
      ) : leads.length === 0 ? (
        <div className="py-8 text-center">
          <div className="text-lg mb-2">🕊️</div>
          <div className="text-xs text-gray">
            No leads yet. When visitors talk to Ama and save their details, they will appear here.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto">
          {leads.map((l) => (
            <div
              key={l.id}
              className="rounded-xl border border-border p-3 flex items-start gap-3 hover:bg-light/50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {(l.name ?? (l.email ?? "?")).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-navy truncate">
                    {l.name ?? "(no name)"}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      sourceColor[l.source] ?? "bg-pale text-navy"
                    }`}
                  >
                    {l.source}
                  </span>
                </div>
                <div className="text-[11px] text-gray truncate mt-0.5">
                  {l.email && <span>{l.email}</span>}
                  {l.email && l.phone && <span> · </span>}
                  {l.phone && <span>{l.phone}</span>}
                </div>
                {l.intent && <div className="text-[10px] text-gray/70 italic truncate mt-0.5">“{l.intent}”</div>}
              </div>
              <div className="text-[10px] text-gray/60 flex-shrink-0 whitespace-nowrap pt-1">
                {new Date(l.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}