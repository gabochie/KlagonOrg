"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/supabase-browser";
import { fetchMyLessonProgress } from "@/lib/queries";
import { ArrowLeft, CheckCircle, Circle, Clock, ExternalLink, Lock } from "lucide-react";
import { ReadAloud } from "@/components/read/ReadAloud";

export interface ViewerLesson {
  id: string;
  title: string;
  duration_min: number | null;
  content_url: string | null;
  sort_order: number | null;
}

export interface ViewerCourse {
  id: string;
  title: string;
  category: string | null;
  icon: string | null;
  description: string | null;
}

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  return m ? m[1] : null;
}

export function CourseViewer({
  course,
  lessons,
}: {
  course: ViewerCourse;
  lessons: ViewerLesson[];
}) {
  const { profile, refreshProfile } = useAuth();
  const [done, setDone] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(lessons[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [xpToast, setXpToast] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.id) return;
    void fetchMyLessonProgress(profile.id).then((ids) => {
      const mine = new Set(ids.filter((id) => lessons.some((l) => l.id === id)));
      setDone(mine);
      const firstOpen = lessons.find((l) => !mine.has(l.id));
      if (firstOpen) setSelectedId(firstOpen.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const selected = lessons.find((l) => l.id === selectedId) ?? null;
  const pct = lessons.length === 0 ? 0 : Math.round((done.size / lessons.length) * 100);
  const selectedDone = selected ? done.has(selected.id) : false;
  const yt = selected?.content_url ? youtubeId(selected.content_url) : null;
  const isPdf =
    !!selected?.content_url && !yt && /\.pdf($|[?#])/i.test(selected.content_url);

  const complete = async (lessonId: string) => {
    const client = getBrowserClient();
    if (!profile || !client) {
      setNotice("Sign in to track your progress and earn XP.");
      return;
    }
    if (done.has(lessonId) || busy) return;
    setBusy(true);
    setNotice(null);
    const { error } = await client
      .from("lesson_progress")
      .insert({ lesson_id: lessonId, member_id: profile.id });
    setBusy(false);
    if (error) {
      setNotice("Could not save progress. Please try again.");
      return;
    }
    setDone((prev) => new Set(prev).add(lessonId));
    await refreshProfile();
    setXpToast("+10 XP earned ðŸŽ‰");
    window.setTimeout(() => setXpToast(null), 3000);
    const nextDone = new Set(done).add(lessonId);
    if (nextDone.size === lessons.length && lessons.length > 0) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 4200);
    }
  };

  return (
    <div className="w-full overflow-hidden">
      <section className="bg-navy py-10 sm:py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/learning"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-amber mb-4"
          >
            <ArrowLeft size={14} /> All courses
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber flex items-center justify-center text-2xl flex-shrink-0">
              {course.icon ?? "ðŸ“š"}
            </div>
            <div className="min-w-0">
              {course.category && (
                <div className="text-[10px] font-bold tracking-widest uppercase text-amber mb-1">
                  {course.category}
                </div>
              )}
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                {course.title}
              </h1>
            </div>
          </div>
          {course.description && (
            <div id="course-desc" className="text-white/60 text-sm mt-3 max-w-2xl">
              {course.description}
            </div>
          )}
          {course.description && (
            <div className="mt-3">
              <ReadAloud targetId="course-desc" />
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-amber transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="text-xs font-bold text-white whitespace-nowrap">
              {done.size}/{lessons.length} Â· {pct}%
            </div>
          </div>
        </div>
      </section>

      <section className="bg-light py-10 sm:py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {celebrate && (
            <>
              <div className="pointer-events-none fixed inset-0 z-[80] overflow-hidden" aria-hidden="true">
                {Array.from({ length: 36 }).map((_, i) => (
                  <span
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${(i * 83) % 100}%`,
                      backgroundColor: ["#F59E0B", "#B45309", "#111827", "#3B82F6", "#22C55E"][i % 5],
                      animationDelay: `${(i % 9) * 0.28}s`,
                      animationDuration: `${2.4 + (i % 5) * 0.35}s`,
                    }}
                  />
                ))}
              </div>
              <div className="xp-toast-center fixed bottom-8 left-1/2 z-[85] rounded-2xl bg-navy px-6 py-3 text-sm font-extrabold text-white shadow-2xl text-center">
                ðŸŽ‰ Course complete â€” amazing work!
                <div className="text-[10px] font-semibold text-amber mt-0.5">
                  {course.title} Â· badges & XP updated
                </div>
              </div>
            </>
          )}
          {xpToast && (
            <div className="xp-toast fixed bottom-20 right-4 z-[80] rounded-full bg-amber px-4 py-2 text-xs font-extrabold text-navy shadow-xl">
              {xpToast}
            </div>
          )}
          {pct === 100 && lessons.length > 0 && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
              Course complete â€” nice work! Your XP and badges are updated on your dashboard.
            </div>
          )}
          {notice && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-navy">
              {notice}{" "}
              {!profile && (
                <Link href="/auth/login" className="font-bold text-blue hover:underline">
                  Sign in â†’
                </Link>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-4">
            <div className="bg-white rounded-xl border border-border p-3 h-fit">
              <div className="text-xs font-bold text-navy px-2 pt-1 pb-2">Lessons</div>
              {lessons.length === 0 && (
                <div className="text-xs text-gray px-2 pb-2">
                  Lessons for this course are being added. Check back soon.
                </div>
              )}
              {lessons.map((l, i) => {
                const isDone = done.has(l.id);
                const isSel = l.id === selectedId;
                return (
                  <button
                    key={l.id}
                    onClick={() => {
                      setSelectedId(l.id);
                      setNotice(null);
                    }}
                    className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left cursor-pointer transition-colors font-sans ${
                      isSel ? "bg-pale" : "hover:bg-light"
                    }`}
                  >
                    <span className="flex-shrink-0">
                      {isDone ? (
                        <CheckCircle size={18} className="text-green-600" />
                      ) : (
                        <Circle size={18} className="text-gray/40" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs font-bold text-navy truncate">
                        {i + 1}. {l.title}
                      </span>
                      {typeof l.duration_min === "number" && (
                        <span className="flex items-center gap-1 text-[10px] text-gray mt-0.5">
                          <Clock size={10} /> {l.duration_min} min
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
              {!selected ? (
                <div className="text-sm text-gray">Select a lesson to begin.</div>
              ) : (
                <>
<div className="text-[10px] font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-1">
                    Lesson
                  </div>
                  <h2 className="text-base font-extrabold text-navy mb-1">{selected.title}</h2>
                  {typeof selected.duration_min === "number" && (
                    <div className="flex items-center gap-1 text-xs text-gray mb-4">
                      <Clock size={12} /> {selected.duration_min} min
                    </div>
                  )}

                  {yt ? (
                    <div className="rounded-xl overflow-hidden border border-border aspect-video mb-4">
                      <iframe
                        src={`https://www.youtube.com/embed/${yt}`}
                        title={selected.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : isPdf && selected.content_url ? (
                    <div className="mb-4">
                      <div className="rounded-xl overflow-hidden border border-border h-[420px] mb-3">
                        <iframe
                          src={selected.content_url}
                          title={selected.title}
                          className="w-full h-full"
                        />
                      </div>
                      <a
                        href={selected.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue hover:underline"
                      >
                        Open PDF in a new tab <ExternalLink size={12} />
                      </a>
                    </div>
                  ) : selected.content_url ? (
                    <a
                      href={selected.content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-pale text-navy text-sm font-bold hover:bg-amber/20 transition-colors mb-4"
                    >
                      Open lesson material <ExternalLink size={14} />
                    </a>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-light px-4 py-6 text-center mb-4">
                      <Lock size={20} className="mx-auto mb-2 text-gray/50" />
                      <div className="text-sm font-bold text-navy">
                        Lesson material publishing soon
                      </div>
                      <div className="text-xs text-gray mt-1">
                        Our team is preparing the video and notes for this lesson. Check back
                        shortly.
                      </div>
                    </div>
                  )}

                  {selectedDone ? (
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm font-bold text-green-800">
                      <CheckCircle size={16} /> Completed Â· +10 XP earned
                    </div>
                  ) : !selected.content_url ? (
                    <button
                      disabled
                      className="w-full py-2.5 rounded-xl bg-light text-gray/60 text-sm font-bold cursor-not-allowed font-sans"
                    >
                      Complete available once material is published
                    </button>
                  ) : !profile ? (
                    <Link
                      href="/auth/login"
                      className="block text-center w-full py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
                    >
                      Sign in to complete Â· +10 XP
                    </Link>
                  ) : (
                    <button
                      onClick={() => void complete(selected.id)}
                      disabled={busy}
                      className="w-full py-2.5 rounded-xl bg-navy text-white text-sm font-bold cursor-pointer hover:bg-blue transition-colors disabled:opacity-50 font-sans"
                    >
                      {busy ? "Savingâ€¦" : "Mark as complete Â· +10 XP"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}