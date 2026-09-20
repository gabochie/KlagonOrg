"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, MapPin } from "lucide-react";
import {
  EVENT_STATUS_LABELS,
  EVENT_TYPE_LABELS,
  approveEvent,
  fetchEventModerationQueue,
  rejectEvent,
} from "@/lib/events";
import type { EventSubmission } from "@/lib/events";
import type { MemberStatus } from "@/lib/database.types";

const STATUS_TABS: MemberStatus[] = ["pending", "approved", "rejected"];

const TAB_COLORS: Record<MemberStatus, string> = {
  pending: "bg-amber text-navy",
  approved: "bg-emerald-500/15 text-emerald-700",
  rejected: "bg-red-500/10 text-red-700",
};

export function EventsModerationQueue() {
  const [status, setStatus] = useState<MemberStatus>("pending");
  const [items, setItems] = useState<EventSubmission[]>([]);
  const [busy, setBusy] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      setBusy(true);
      const data = await fetchEventModerationQueue(status);
      if (active) {
        setItems(data);
        setBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [status]);

  const reload = async () => setItems(await fetchEventModerationQueue(status));

  const onApprove = async (id: string) => {
    const res = await approveEvent(id);
    if (!res.ok) return window.alert(res.error ?? "Could not approve this event.");
    await reload();
  };

  const onReject = async (id: string) => {
    if (!reason.trim()) return;
    setRejecting(true);
    const res = await rejectEvent(id, reason.trim());
    setRejecting(false);
    if (!res.ok) return window.alert(res.error ?? "Could not reject this event.");
    setRejectId(null);
    setReason("");
    await reload();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setRejectId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              status === s ? TAB_COLORS[s] : "bg-white text-gray border border-border hover:bg-light"
            }`}
          >
            {EVENT_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {busy ? (
        <div className="py-16 text-center">
          <div className="animate-pulse text-xs text-gray font-semibold">Loading events…</div>
        </div>
      ) : items.length === 0 ? (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
            <div className="text-3xl mb-3">📅</div>
            <div className="text-sm font-bold text-navy mb-1">
              {status === "pending" ? "Queue is clear" : `No ${status} events`}
            </div>
            <div className="text-xs text-gray">
              {status === "pending"
                ? "Member-proposed events awaiting your approval will appear here."
                : "Nothing here yet."}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-pale flex items-center justify-center flex-shrink-0 border border-border">
                  <span className="text-lg">📅</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-amber-strong">
                      {EVENT_TYPE_LABELS[e.type]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${TAB_COLORS[e.status]}`}>
                      {EVENT_STATUS_LABELS[e.status]}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-navy mt-0.5">{e.title}</div>
                  <div className="text-[11px] text-gray mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size="11" /> {new Date(e.date).toDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size="11" /> {e.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size="11" /> {e.location || "TBD"}
                    </span>
                    {e.spots > 0 && <span>{e.spots} spots</span>}
                  </div>
                  <div className="text-[11px] text-gray mt-0.5">
                    Proposed by <span className="font-bold text-navy">{e.authorName}</span> ·{" "}
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                  {e.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {e.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full bg-amber/15 text-navy text-[10px] font-bold uppercase tracking-wide"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {e.description && (
                    <div className="text-[11px] text-gray mt-1.5 line-clamp-2">{e.description}</div>
                  )}
                  {e.status === "rejected" && e.rejectedReason && (
                    <div className="mt-1.5 text-[11px] text-red-700 bg-red-50 border border-red/30 rounded-lg px-2.5 py-1.5">
                      Reason: {e.rejectedReason}
                    </div>
                  )}
                  {status !== "rejected" && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <button
                        onClick={() => void onApprove(e.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 text-[11px] font-bold hover:bg-emerald-500/25 transition-colors cursor-pointer"
                      >
                        ✓ Approve & publish
                      </button>
                      <button
                        onClick={() => {
                          setRejectId(e.id);
                          setReason("");
                        }}
                        className="px-2.5 py-1 rounded-lg text-red-700 text-[11px] font-bold hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  )}
                  {rejectId === e.id && (
                    <div className="mt-2.5 rounded-xl border border-red/30 bg-red-50/50 p-3">
                      <textarea
                        rows={2}
                        value={reason}
                        onChange={(ev) => setReason(ev.target.value)}
                        placeholder="Why are you rejecting? The proposer will see this."
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm font-sans bg-white focus:outline-2 focus:outline-red"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          disabled={rejecting || !reason.trim()}
                          onClick={() => void onReject(e.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {rejecting ? "Rejecting…" : "Reject & notify"}
                        </button>
                        <button
                          onClick={() => setRejectId(null)}
                          className="px-3 py-1.5 rounded-lg border border-border text-navy text-[11px] font-bold hover:bg-light transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}