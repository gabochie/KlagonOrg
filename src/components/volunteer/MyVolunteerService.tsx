"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchMyVolunteerApplications,
  fetchMyVolunteerHours,
  fetchMyVolunteerReviews,
  fetchMyVolunteerTasks,
  logVolunteerHours,
  setVolunteerTaskDone,
  type VolunteerApplication,
  type VolunteerHours,
  type VolunteerReview,
  type VolunteerTask,
} from "@/lib/volunteers";

const inputCls =
  "rounded-lg border border-border bg-white px-3 py-2 text-xs text-navy focus:outline-none focus:border-navy";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Member view: my tasks, hour log, reviews. Shown on the dashboard volunteer page. */
export function MyVolunteerService() {
  const { profile, refreshProfile } = useAuth();
  const [apps, setApps] = useState<VolunteerApplication[]>([]);
  const [tasks, setTasks] = useState<VolunteerTask[]>([]);
  const [hours, setHours] = useState<VolunteerHours[]>([]);
  const [reviews, setReviews] = useState<VolunteerReview[]>([]);
  const [logApp, setLogApp] = useState("");
  const [logHours, setLogHours] = useState("");
  const [logDate, setLogDate] = useState(todayISO());
  const [logNote, setLogNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const memberId = profile?.id ?? null;

  const load = useCallback(() => {
    if (!memberId) return;
    void fetchMyVolunteerApplications(memberId).then(setApps);
    void fetchMyVolunteerTasks(memberId).then(setTasks);
    void fetchMyVolunteerHours(memberId).then(setHours);
    void fetchMyVolunteerReviews(memberId).then(setReviews);
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const engagements = apps.filter((a) => ["probationary", "active"].includes(a.status));
  if (!memberId || engagements.length === 0) return null;

  const toggleTask = async (t: VolunteerTask) => {
    const ok = await setVolunteerTaskDone(t.id, t.status !== "done");
    if (!ok) {
      setNotice("Could not update the task. Please try again.");
      return;
    }
    if (t.status !== "done") {
      await refreshProfile();
    }
    load();
  };

  const submitHours = async () => {
    const h = Number(logHours);
    const appId = logApp || engagements[0]?.id;
    if (!appId || !(h > 0) || h > 24 || !memberId) {
      setNotice("Pick a role, enter hours (0–24) and a date.");
      return;
    }
    setBusy(true);
    setNotice(null);
    const res = await logVolunteerHours(memberId, appId, h, logDate, logNote.trim() || null);
    setBusy(false);
    if (!res.ok) {
      setNotice(res.error);
      return;
    }
    setLogHours("");
    setLogNote("");
    setNotice(`Logged ${h}h 🎉 +${Math.floor(h) * 2} XP earned.`);
    await refreshProfile();
    load();
  };

  return (
    <div className="rounded-xl border border-border bg-white p-5 sm:p-6 mb-6">
      <h2 className="text-base font-extrabold text-navy mb-1">My service</h2>
      <p className="text-xs text-gray mb-4">
        Tasks from your coordinators, your hour log, and your performance reviews.
      </p>
      {notice && (
        <div className="mb-3 rounded-lg bg-amber/10 px-3.5 py-2.5 text-xs font-semibold text-navy">
          {notice}
        </div>
      )}

      <h3 className="text-xs font-extrabold text-navy mb-2">Tasks ({tasks.length})</h3>
      {tasks.length === 0 ? (
        <p className="text-xs text-gray mb-4">No tasks assigned yet — check back soon.</p>
      ) : (
        <div className="space-y-2 mb-5">
          {tasks.map((t) => (
            <label
              key={t.id}
              className="flex items-start gap-2.5 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:border-navy transition-colors"
            >
              <input
                type="checkbox"
                checked={t.status === "done"}
                onChange={() => void toggleTask(t)}
                className="mt-0.5 h-4 w-4 accent-[#1A2E8C]"
              />
              <span className="flex-1 min-w-0">
                <span
                  className={`block text-xs font-bold ${t.status === "done" ? "text-gray line-through" : "text-navy"}`}
                >
                  {t.title}
                </span>
                {t.description && (
                  <span className="block text-[11px] text-gray mt-0.5">{t.description}</span>
                )}
                {t.due_at && (
                  <span className="block text-[11px] text-gray mt-0.5">
                    Due {new Date(t.due_at).toLocaleDateString()}
                  </span>
                )}
              </span>
              {t.status === "done" && (
                <span className="text-[10px] font-bold text-green-800 whitespace-nowrap">+10 XP</span>
              )}
            </label>
          ))}
        </div>
      )}

      <h3 className="text-xs font-extrabold text-navy mb-2">Log hours</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-2">
        <select value={logApp} onChange={(e) => setLogApp(e.target.value)} className={inputCls}>
          <option value="">Select role…</option>
          {engagements.map((a) => (
            <option key={a.id} value={a.id}>
              {a.role}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0.5}
          max={24}
          step={0.5}
          value={logHours}
          onChange={(e) => setLogHours(e.target.value)}
          placeholder="Hours"
          className={inputCls}
        />
        <input
          type="date"
          value={logDate}
          max={todayISO()}
          onChange={(e) => setLogDate(e.target.value)}
          className={inputCls}
        />
        <input
          value={logNote}
          onChange={(e) => setLogNote(e.target.value)}
          placeholder="What did you do? (optional)"
          className={`${inputCls} col-span-2 sm:col-span-1`}
        />
        <button
          type="button"
          onClick={() => void submitHours()}
          disabled={busy}
          className="rounded-lg bg-navy px-3 py-2 text-xs font-bold text-white hover:bg-blue transition-colors disabled:opacity-50 font-sans col-span-2 sm:col-span-1"
        >
          {busy ? "Saving…" : "Log hours"}
        </button>
      </div>
      <p className="text-[11px] text-gray mb-4">+2 XP per hour. A coordinator verifies entries.</p>

      {hours.length > 0 && (
        <>
          <h3 className="text-xs font-extrabold text-navy mb-2">Recent hours</h3>
          <div className="space-y-1.5 mb-4">
            {hours.slice(0, 8).map((h) => (
              <div key={h.id} className="flex items-center gap-2 text-xs text-gray">
                <span className="font-bold text-navy">{h.hours}h</span>
                <span>{h.worked_on}</span>
                {h.note && <span className="truncate">· {h.note}</span>}
                <span
                  className={`ml-auto text-[10px] font-bold whitespace-nowrap ${h.verified ? "text-green-800" : "text-gray/60"}`}
                >
                  {h.verified ? "✓ verified" : "pending"}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {reviews.length > 0 && (
        <>
          <h3 className="text-xs font-extrabold text-navy mb-2">Performance reviews</h3>
          <div className="space-y-2">
            {reviews.map((r) => (
              <ReviewRow key={r.id} review={r} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewRow({ review }: { review: VolunteerReview }) {
  return (
    <div className="rounded-lg border border-border bg-pale px-3 py-2.5">
      <div className="text-xs font-extrabold text-navy">{"⭐".repeat(review.rating)}</div>
      {review.note && <div className="text-xs text-gray mt-0.5">“{review.note}”</div>}
      <div className="text-[10px] text-gray mt-1">
        {new Date(review.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}
