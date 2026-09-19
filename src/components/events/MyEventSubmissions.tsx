"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { EVENT_STATUS_LABELS, fetchMyEventSubmissions, withdrawEvent } from "@/lib/events";
import type { EventSubmission } from "@/lib/events";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber text-navy",
  approved: "bg-green text-white",
  rejected: "bg-red text-white",
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function MyEventSubmissions() {
  const { profile } = useAuth();
  const [items, setItems] = useState<EventSubmission[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const memberId = profile?.id;
    if (!memberId) return;
    let active = true;
    void (async () => {
      const data = await fetchMyEventSubmissions(memberId);
      if (!active) return;
      setBusy(false);
      setItems(data);
    })();
    return () => {
      active = false;
    };
  }, [profile?.id]);

  const onWithdraw = async (id: string) => {
    const memberId = profile?.id;
    if (!memberId) return;
    if (!window.confirm("Withdraw this event proposal?")) return;
    const res = await withdrawEvent(id, memberId);
    if (!res.ok) return window.alert(res.error ?? "Could not withdraw.");
    setItems(await fetchMyEventSubmissions(memberId));
  };

  if (!profile) return null;

  return (
    <div>
      {busy ? (
        <div className="py-10 text-center">
          <div className="animate-pulse text-xs text-gray font-semibold">Loading your submissions…</div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-6 text-center">
          <p className="text-sm font-bold text-navy mb-1">No event submissions yet</p>
          <p className="text-xs text-gray">Propose an event and track its approval right here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((e) => (
            <div key={e.id} className="rounded-2xl border border-border bg-white p-4 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLOR[e.status]}`}>
                    {EVENT_STATUS_LABELS[e.status]}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-amber-strong">
                    {e.type}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-navy mt-1">{e.title}</div>
                <div className="text-[11px] text-gray mt-0.5">
                  {fmtDate(e.date)} · {e.time} · {e.location || "Location TBD"}{" "}
                  {e.spots > 0 ? ` · ${e.spots} spots` : " · Open"}{" "}
                  <span className="text-gray/60">· submitted {new Date(e.createdAt).toLocaleDateString()}</span>
                </div>
                {e.status === "rejected" && e.rejectedReason && (
                  <div className="mt-1.5 text-[11px] text-red-700 bg-red-50 border border-red/30 rounded-lg px-2.5 py-1.5">
                    Reason: {e.rejectedReason} — edit it on the events page and resubmit.
                  </div>
                )}
              </div>
              {e.status === "pending" && (
                <button
                  onClick={() => void onWithdraw(e.id)}
                  className="shrink-0 px-2.5 py-1 rounded-lg border border-border text-xs font-bold text-gray hover:text-red-700 hover:border-red/40 cursor-pointer transition-colors font-sans"
                >
                  Withdraw
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}