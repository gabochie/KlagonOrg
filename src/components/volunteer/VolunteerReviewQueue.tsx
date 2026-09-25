"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchVolunteerReviewQueue,
  reviewVolunteerApplication,
  type VolunteerApplication,
} from "@/lib/volunteers";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber/10 text-navy",
  probationary: "bg-blue/10 text-blue-800",
  active: "bg-green/10 text-green-800",
  inactive: "bg-light text-gray",
  rejected: "bg-red-50 text-red-800",
};

function daysLeft(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return "review due";
  return `${Math.ceil(ms / 86400000)}d left`;
}

export function VolunteerReviewQueue() {
  const { profile } = useAuth();
  const [apps, setApps] = useState<VolunteerApplication[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetchVolunteerReviewQueue().then(setApps);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const review = async (
    app: VolunteerApplication,
    status: "probationary" | "active" | "inactive" | "rejected",
  ) => {
    if (!profile?.id || busyId) return;
    setBusyId(app.id);
    setNotice(null);
    const ok = await reviewVolunteerApplication(app.id, status, profile.id);
    setBusyId(null);
    if (!ok) {
      setNotice("Could not update. Please try again.");
      return;
    }
    load();
  };

  const pending = apps.filter((a) => a.status === "pending");
  const rest = apps.filter((a) => a.status !== "pending");

  const row = (app: VolunteerApplication) => (
    <div
      key={app.id}
      className="bg-white rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center gap-3"
    >
      {app.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={app.photo_url}
          alt={app.member_name ?? app.role}
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-light flex items-center justify-center text-lg flex-shrink-0">
          🙋
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-extrabold text-navy truncate">
          {app.member_name ?? "Member"} · {app.role}
        </div>
        <div className="text-[11px] text-gray mt-0.5">
          ID on file ({app.id_type.replace(/_/g, " ")}) · terms v{app.terms_version} · applied{" "}
          {new Date(app.created_at).toLocaleDateString()}
          {app.status === "probationary" && app.probation_ends_at && (
            <> · probation {daysLeft(app.probation_ends_at)}</>
          )}
        </div>
        <span
          className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[app.status] ?? "bg-light text-gray"}`}
        >
          {app.status}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {app.status === "pending" && (
          <>
            <button
              type="button"
              disabled={busyId === app.id}
              onClick={() => void review(app, "probationary")}
              className="px-3 py-1.5 rounded-lg bg-navy text-white text-[11px] font-bold hover:bg-blue transition-colors disabled:opacity-50 font-sans"
            >
              Approve → probation
            </button>
            <button
              type="button"
              disabled={busyId === app.id}
              onClick={() => void review(app, "rejected")}
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-[11px] font-bold text-red-700 hover:border-red-400 transition-colors disabled:opacity-50 font-sans"
            >
              Reject
            </button>
          </>
        )}
        {app.status === "probationary" && (
          <>
            <button
              type="button"
              disabled={busyId === app.id}
              onClick={() => void review(app, "active")}
              className="px-3 py-1.5 rounded-lg bg-green-700 text-white text-[11px] font-bold hover:bg-green-800 transition-colors disabled:opacity-50 font-sans"
            >
              Confirm active
            </button>
            <button
              type="button"
              disabled={busyId === app.id}
              onClick={() => void review(app, "inactive")}
              className="px-3 py-1.5 rounded-lg border border-border bg-white text-[11px] font-bold text-gray hover:border-navy transition-colors disabled:opacity-50 font-sans"
            >
              End engagement
            </button>
          </>
        )}
        {app.status === "active" && (
          <button
            type="button"
            disabled={busyId === app.id}
            onClick={() => void review(app, "inactive")}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-[11px] font-bold text-gray hover:border-navy transition-colors disabled:opacity-50 font-sans"
          >
            End engagement
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      {notice && (
        <div className="mb-3 rounded-lg bg-amber/10 px-3.5 py-2.5 text-xs font-semibold text-navy">
          {notice}
        </div>
      )}
      <h2 className="text-sm font-extrabold text-navy mb-2">
        Pending review ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-xs text-gray mb-6">
          No applications waiting. New applications appear here for ID verification.
        </div>
      ) : (
        <div className="space-y-2.5 mb-6">{pending.map(row)}</div>
      )}
      <h2 className="text-sm font-extrabold text-navy mb-2">All applications ({rest.length})</h2>
      {rest.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-xs text-gray">
          Nothing here yet.
        </div>
      ) : (
        <div className="space-y-2.5">{rest.map(row)}</div>
      )}
    </div>
  );
}
