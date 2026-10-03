"use client";

/**
 * Course price manager (admin only).
 *
 * A blank price means the course is free and its lessons stay in the public
 * static build. Setting a price turns on the paid flow: the reader renders the
 * client gate, and the database withholds lesson content until a MoMo payment
 * grants a lifetime entitlement. Prices are in Ghana cedis (GH₵).
 *
 * Like course covers, the price is stored immediately but the public gate only
 * changes on the next site rebuild (daily publish, or workflow_dispatch).
 */

import { useCallback, useEffect, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { LoadingMessage } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface AdminCourse {
  id: string;
  title: string;
  published: boolean;
  price_ghs: number | null;
}

export function CoursePriceManager() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) {
      setLoading(false);
      return;
    }
    const { data, error } = await c
      .from("courses")
      .select("id,title,published,price_ghs")
      .order("created_at", { ascending: true });
    if (error) {
      setNotice({ kind: "err", text: error.message });
    } else {
      setCourses((data ?? []) as AdminCourse[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const valueFor = (course: AdminCourse) =>
    draft[course.id] ?? (course.price_ghs != null ? String(course.price_ghs) : "");

  const save = async (course: AdminCourse, raw: string) => {
    if (busyId) return;
    const c = getBrowserClient();
    if (!c) return;

    const trimmed = raw.trim();
    let price: number | null = null;
    if (trimmed !== "") {
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        setNotice({
          kind: "err",
          text: "Enter a price greater than 0, or leave it blank to make the course free.",
        });
        return;
      }
      price = Math.round(parsed * 100) / 100;
    }

    setBusyId(course.id);
    setNotice(null);
    const { error } = await c.from("courses").update({ price_ghs: price }).eq("id", course.id);
    setBusyId(null);
    if (error) {
      setNotice({ kind: "err", text: error.message });
      return;
    }
    setCourses((prev) => prev.map((x) => (x.id === course.id ? { ...x, price_ghs: price } : x)));
    setDraft((prev) => {
      const next = { ...prev };
      delete next[course.id];
      return next;
    });
    setNotice({
      kind: "ok",
      text:
        price == null
          ? `“${course.title}” is now free. Its lessons become public on the next rebuild.`
          : `“${course.title}” now costs GH₵ ${price}. The paid gate appears on the next rebuild.`,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-sm font-bold text-navy">Course pricing</div>
        <div className="text-[11px] text-gray">
          {loading ? "Loading…" : `${courses.length} course${courses.length === 1 ? "" : "s"}`}
        </div>
      </div>
      <p className="text-[11px] text-gray mb-3">
        Leave blank for a free course. A GH₵ price turns on the paid flow: learners sign in, pay once
        by Mobile Money, and keep lifetime access. Changes publish with the next site rebuild.
      </p>

      {notice && (
        <div
          role="status"
          className={`mb-3 rounded-lg border px-3 py-2 text-[11px] font-semibold ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {notice.text}
        </div>
      )}

      {loading ? (
        <LoadingMessage label="Loading courses…" className="py-10" />
      ) : courses.length === 0 ? (
        <EmptyState
          icon="📚"
          compact
          title="No courses yet"
          description="Courses appear here once they exist in the database."
        />
      ) : (
        <div className="space-y-2">
          {courses.map((course) => {
            const busy = busyId === course.id;
            const value = valueFor(course);
            const paid = course.price_ghs != null && course.price_ghs > 0;
            return (
              <div
                key={course.id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-navy truncate" title={course.title}>
                    {course.title}
                  </div>
                  <div className="text-[10px] text-gray mt-0.5">
                    {course.published ? "Published" : "Draft"} ·{" "}
                    {paid ? `Paid — GH₵ ${course.price_ghs}` : "Free"}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray">GH₵</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={value}
                    placeholder="Free"
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [course.id]: e.target.value }))
                    }
                    className="w-24 rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-semibold text-navy focus:outline-none focus:border-navy"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void save(course, value)}
                    className="rounded-lg bg-navy px-3 py-1.5 text-[11px] font-bold text-white font-sans hover:bg-blue transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
