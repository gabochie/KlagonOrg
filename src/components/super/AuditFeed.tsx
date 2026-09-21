"use client";

import { useEffect, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";

interface Send {
  id: number;
  company: string | null;
  wa_phone: string;
  template: string;
  outcome: string;
  created_at: string;
}

function mask(phone: string): string {
  const d = phone.replace(/\D/g, "");
  return d.length > 4 ? `…${d.slice(-4)}` : d;
}

export function AuditFeed() {
  const [rows, setRows] = useState<Send[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) return;
    void c
      .from("outreach_sends")
      .select("id, company, wa_phone, template, outcome, created_at")
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (!error && data) setRows(data as Send[]);
        else if (error) setNotice(`Could not load audit trail: ${error.message}`);
      });
  }, []);

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="text-sm font-extrabold text-navy">Outreach audit</div>
      <div className="text-[11px] text-gray mt-0.5 mb-3">
        Latest sends across all staff slots. Phones masked — full numbers live in the queue.
      </div>
      {notice && (
        <div className="mb-3 text-[11px] font-semibold text-amber-800 bg-amber/10 rounded-lg px-3 py-2">
          {notice}
        </div>
      )}
      <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto">
        {rows.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-border px-3 py-2 flex items-center justify-between gap-2"
          >
            <div className="min-w-0">
              <div className="text-xs font-bold text-navy truncate">
                {r.company || mask(r.wa_phone)}
              </div>
              <div className="text-[10px] text-gray">
                {r.template} · {new Date(r.created_at).toLocaleString()}
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pale text-navy shrink-0">
              {r.outcome}
            </span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="py-6 text-center text-xs text-gray">No sends logged yet.</div>
        )}
      </div>
    </div>
  );
}
