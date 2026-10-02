"use client";

/**
 * Course cover manager (admin only).
 *
 * Course pages are part of the static export, so a cover uploaded here appears
 * on the public site only after the next rebuild (the daily publish, or a
 * manual workflow_dispatch of publish.yml). This screen shows the DB value
 * immediately, so staff can confirm what was saved in the meantime.
 *
 * Uploads go into the course-media bucket under courses/<id>/ (admin-only per
 * RLS, see 20260928000000_course_covers.sql). A course with no uploaded cover
 * keeps its authored/branded template — clearing one never leaves it imageless.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { uploadCourseMedia } from "@/lib/storage";
import { CourseCover } from "@/components/learning/CourseCover";
import { LoadingMessage } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

interface AdminCourse {
  id: string;
  title: string;
  category: string | null;
  icon: string | null;
  cover_url: string | null;
  published: boolean;
}

export function CourseCoverManager() {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const c = isSupabaseConfigured() ? getBrowserClient() : null;
    if (!c) {
      setLoading(false);
      return;
    }
    const { data, error } = await c
      .from("courses")
      .select("id,title,category,icon,cover_url,published")
      .order("created_at", { ascending: true });
    if (!error) setCourses((data ?? []) as AdminCourse[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const upload = async (course: AdminCourse, file: File) => {
    if (busyId) return;
    const c = getBrowserClient();
    if (!c) return;
    setBusyId(course.id);
    setNotice(null);

    const up = await uploadCourseMedia(file, course.id);
    if (!up.ok) {
      setBusyId(null);
      setNotice({ kind: "err", text: up.error });
      return;
    }
    const { error } = await c.from("courses").update({ cover_url: up.url }).eq("id", course.id);
    setBusyId(null);
    if (error) {
      setNotice({ kind: "err", text: error.message });
      return;
    }
    setCourses((prev) =>
      prev.map((x) => (x.id === course.id ? { ...x, cover_url: up.url } : x)),
    );
    setNotice({
      kind: "ok",
      text: `Cover updated for “${course.title}”. Public pages refresh on the next rebuild.`,
    });
  };

  const clear = async (course: AdminCourse) => {
    if (busyId) return;
    const c = getBrowserClient();
    if (!c) return;
    setBusyId(course.id);
    setNotice(null);
    const { error } = await c.from("courses").update({ cover_url: null }).eq("id", course.id);
    setBusyId(null);
    if (error) {
      setNotice({ kind: "err", text: error.message });
      return;
    }
    setCourses((prev) => prev.map((x) => (x.id === course.id ? { ...x, cover_url: null } : x)));
    setNotice({
      kind: "ok",
      text: `Removed the cover for “${course.title}”. The branded template now shows.`,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-sm font-bold text-navy">Course covers</div>
        <div className="text-[11px] text-gray">
          {loading ? "Loading…" : `${courses.length} course${courses.length === 1 ? "" : "s"}`}
        </div>
      </div>
      <p className="text-[11px] text-gray mb-3">
        Upload a 16:9 image per course. Card and hero sizes are generated at authoring time, so
        upload a wide (landscape) image. Changes publish with the next site rebuild.
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((course) => {
            const busy = busyId === course.id;
            const hasCover = Boolean(course.cover_url);
            return (
              <div key={course.id} className="rounded-xl border border-border overflow-hidden">
                <div className="relative aspect-video bg-light">
                  <CourseCover
                    course={{ coverUrl: course.cover_url, category: course.category }}
                    icon={course.icon ?? "📚"}
                    title={course.title}
                  />
                  {!course.published && (
                    <span className="absolute top-2 left-2 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] font-bold text-white">
                      Draft
                    </span>
                  )}
                  {hasCover && (
                    <span className="absolute top-2 right-2 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-bold text-white">
                      Custom
                    </span>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs font-bold text-navy leading-snug truncate" title={course.title}>
                    {course.title}
                  </div>
                  <div className="text-[10px] text-gray mt-0.5">
                    {course.category ?? "Uncategorised"} · {hasCover ? "uploaded cover" : "template"}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      ref={(el) => {
                        inputs.current[course.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(course, file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => inputs.current[course.id]?.click()}
                      className="flex-1 rounded-lg bg-navy px-2.5 py-1.5 text-[11px] font-bold text-white font-sans hover:bg-blue transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {busy ? "Saving…" : hasCover ? "Replace" : "Upload"}
                    </button>
                    {hasCover && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void clear(course)}
                        className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray font-sans hover:bg-light transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
