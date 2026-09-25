"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  createVolunteerTask,
  fetchApplicationHours,
  fetchVolunteerPerformance,
  postVolunteerReview,
  verifyVolunteerHours,
  type VolunteerHours,
  type VolunteerPerformance,
} from "@/lib/volunteers";

const inputCls =
  "rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:outline-none focus:border-navy w-full";

function probationLabel(iso: string | null): string {
  if (!iso) return "—";
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return "—";
  if (ms <= 0) return "review due";
  return `${Math.ceil(ms / 86400000)}d left`;
}

/** Probation ending within 7 days, soonest first. Pure: now is an argument. */
function selectProbationWatch(
  rows: VolunteerPerformance[],
  nowMs: number,
): VolunteerPerformance[] {
  return rows
    .filter(
      (r) =>
        r.application.status === "probationary" &&
        r.application.probation_ends_at &&
        new Date(r.application.probation_ends_at).getTime() - nowMs < 7 * 86400000,
    )
    .sort(
      (a, b) =>
        new Date(a.application.probation_ends_at as string).getTime() -
        new Date(b.application.probation_ends_at as string).getTime(),
    );
}

export function VolunteerPerformancePanel() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<VolunteerPerformance[]>([]);
  const [watch, setWatch] = useState<VolunteerPerformance[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hours, setHours] = useState<VolunteerHours[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [rating, setRating] = useState("5");
  const [reviewNote, setReviewNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetchVolunteerPerformance().then((data) => {
      setRows(data);
      setWatch(selectProbationWatch(data, Date.now()));
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openRow = (appId: string) => {
    if (expanded === appId) {
      setExpanded(null);
      return;
    }
    setExpanded(appId);
    setTaskTitle("");
    setTaskDue("");
    setRating("5");
    setReviewNote("");
    void fetchApplicationHours(appId).then(setHours);
  };

  const refreshRow = (appId: string) => {
    load();
    void fetchApplicationHours(appId).then(setHours);
  };

  const assignTask = async (appId: string) => {
    if (!profile?.id || !taskTitle.trim() || busy) return;
    setBusy(true);
    const ok = await createVolunteerTask(
      appId,
      taskTitle,
      null,
      taskDue || null,
      profile.id,
    );
    setBusy(false);
    if (!ok) {
      setNotice("Could not assign the task.");
      return;
    }
    setTaskTitle("");
    setTaskDue("");
    setNotice("Task assigned — the volunteer is notified.");
    refreshRow(appId);
  };

  const submitReview = async (appId: string) => {
    if (!profile?.id || busy) return;
    setBusy(true);
    const ok = await postVolunteerReview(appId, profile.id, Number(rating), reviewNote.trim() || null);
    setBusy(false);
    if (!ok) {
      setNotice("Could not post the review.");
      return;
    }
    setReviewNote("");
    setNotice(
      Number(rating) === 5
        ? "5-star review posted — +25 XP and Star Volunteer badge awarded."
        : "Review posted — the volunteer is notified.",
    );
    refreshRow(appId);
  };

  const verifyHours = async (h: VolunteerHours, verified: boolean) => {
    const ok = await verifyVolunteerHours(h.id, verified);
    if (!ok) {
      setNotice("Could not update hours.");
      return;
    }
    void fetchApplicationHours(h.application_id).then(setHours);
    load();
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-white px-4 py-6 text-center text-xs text-gray">
        No active or probationary volunteers yet. Performance data appears here once applications
        are approved.
      </div>
    );
  }

  return (
    <div>
      {notice && (
        <div className="mb-3 rounded-lg bg-amber/10 px-3.5 py-2.5 text-xs font-semibold text-navy">
          {notice}
        </div>
      )}

      {watch.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-xs font-extrabold text-navy mb-2">
            ⏰ Probation watch — review due within 7 days ({watch.length})
          </h3>
          <div className="space-y-1.5">
            {watch.map((r) => (
              <div key={r.application.id} className="flex items-center gap-2 text-xs">
                <span className="font-bold text-navy">
                  {r.application.member_name ?? "Member"}
                </span>
                <span className="text-gray">· {r.application.role}</span>
                <span className="ml-auto font-bold text-amber-800 whitespace-nowrap">
                  {probationLabel(r.application.probation_ends_at)}
                </span>
                <button
                  type="button"
                  onClick={() => openRow(r.application.id)}
                  className="text-[11px] font-bold text-blue hover:underline whitespace-nowrap"
                >
                  Review →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {rows.map((r) => {
          const a = r.application;
          const isOpen = expanded === a.id;
          return (
            <div key={a.id} className="bg-white rounded-xl border border-border p-4">
              <button
                type="button"
                onClick={() => openRow(a.id)}
                className="w-full flex items-center gap-2 text-left cursor-pointer"
              >
                <span className="text-sm font-extrabold text-navy truncate">
                  {a.member_name ?? "Member"}
                </span>
                <span className="text-[11px] text-gray truncate">· {a.role}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                    a.status === "active" ? "bg-green/10 text-green-800" : "bg-blue/10 text-blue-800"
                  }`}
                >
                  {a.status}
                </span>
                <span className="ml-auto text-[11px] text-gray whitespace-nowrap">
                  {r.tasksDone}/{r.tasksDone + r.tasksOpen} tasks · {r.hoursTotal}h
                  {r.avgRating !== null ? ` · ⭐${r.avgRating.toFixed(1)}` : ""}
                  {a.status === "probationary" ? ` · ${probationLabel(a.probation_ends_at)}` : ""}
                </span>
              </button>

              {isOpen && (
                <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-[11px] font-extrabold text-navy mb-2">Assign task</h4>
                    <input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Task title"
                      className={`${inputCls} mb-2`}
                    />
                    <input
                      type="date"
                      value={taskDue}
                      onChange={(e) => setTaskDue(e.target.value)}
                      className={`${inputCls} mb-2`}
                    />
                    <button
                      type="button"
                      disabled={busy || !taskTitle.trim()}
                      onClick={() => void assignTask(a.id)}
                      className="w-full rounded-lg bg-navy px-3 py-2 text-[11px] font-bold text-white hover:bg-blue transition-colors disabled:opacity-50 font-sans"
                    >
                      Assign
                    </button>
                    <h4 className="text-[11px] font-extrabold text-navy mt-4 mb-2">
                      Hours log ({hours.length})
                    </h4>
                    {hours.length === 0 ? (
                      <p className="text-[11px] text-gray">No hours logged yet.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {hours.map((h) => (
                          <div key={h.id} className="flex items-center gap-2 text-[11px] text-gray">
                            <span className="font-bold text-navy">{h.hours}h</span>
                            <span>{h.worked_on}</span>
                            <button
                              type="button"
                              onClick={() => void verifyHours(h, !h.verified)}
                              className={`ml-auto font-bold whitespace-nowrap ${h.verified ? "text-green-800" : "text-blue hover:underline"}`}
                            >
                              {h.verified ? "✓ verified" : "Verify"}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <h4 className="text-[11px] font-extrabold text-navy mb-2">
                      Post performance review
                    </h4>
                    <div className="flex gap-2 mb-2">
                      <select
                        value={rating}
                        onChange={(e) => setRating(e.target.value)}
                        className={`${inputCls} w-28`}
                        aria-label="Rating"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {"⭐".repeat(n)} {n}/5
                          </option>
                        ))}
                      </select>
                      <input
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="Feedback note (shown to the volunteer)"
                        className={inputCls}
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void submitReview(a.id)}
                      className="rounded-lg bg-navy px-4 py-2 text-[11px] font-bold text-white hover:bg-blue transition-colors disabled:opacity-50 font-sans"
                    >
                      Post review
                    </button>
                    <p className="mt-2 text-[11px] text-gray leading-relaxed">
                      Reviews notify the volunteer instantly. A 5-star review awards +25 XP and the
                      Star Volunteer badge (once per engagement). Confirming probation awards the
                      Probation Passed badge from the review queue above.
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
