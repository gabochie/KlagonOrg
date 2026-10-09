"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CourseCover } from "@/components/learning/CourseCover";
import { CourseCheckout } from "@/components/learning/CourseCheckout";
import { CourseViewer, type ViewerCourse, type ViewerLesson } from "@/components/learning/CourseViewer";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/supabase-browser";
import { ArrowLeft, Clock, Lock } from "lucide-react";

/**
 * Client gate for a paid course.
 *
 * Paid lesson content is deliberately NOT baked into the static build: the
 * server ships this gate instead, and the lessons are fetched here only after
 * the signed-in member is shown to hold an entitlement. The database
 * (lessons_read_public) enforces the same rule, so the gate is UX, not the
 * security boundary.
 */
export function PaidCourseGate({
  course,
  backHref = "/learning",
}: {
  course: ViewerCourse & { price_ghs: number };
  backHref?: string;
}) {
  const { profile, session, loading, profileLoaded } = useAuth();
  const [checking, setChecking] = useState(true);
  const [entitled, setEntitled] = useState(false);
  const [lessons, setLessons] = useState<ViewerLesson[]>([]);
  const [lessonsLoaded, setLessonsLoaded] = useState(false);

  const loadLessons = useCallback(async () => {
    const client = getBrowserClient();
    if (!client) return;
    const { data } = await client
      .from("lessons")
      .select("id,title,duration_min,content_url,content,sort_order")
      .eq("course_id", course.id)
      .order("sort_order", { ascending: true });
    setLessons(
      (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        duration_min: row.duration_min,
        content_url: row.content_url,
        content: row.content,
        sort_order: row.sort_order,
      }))
    );
    setLessonsLoaded(true);
  }, [course.id]);

  const checkAccess = useCallback(async () => {
    if (!profile?.id) {
      setEntitled(false);
      setChecking(false);
      return;
    }
    const client = getBrowserClient();
    if (!client) {
      setChecking(false);
      return;
    }
    const { data } = await client
      .from("course_entitlements")
      .select("id")
      .eq("member_id", profile.id)
      .eq("course_id", course.id)
      .maybeSingle();
    const has = !!data;
    setEntitled(has);
    setChecking(false);
    if (has) void loadLessons();
  }, [profile, course.id, loadLessons]);

  useEffect(() => {
    if (loading || !profileLoaded) return;
    void (async () => {
      await checkAccess();
    })();
  }, [loading, profileLoaded, checkAccess]);

  // The hero is public marketing (cover + title + price), identical for the
  // checking shell and the paywall: static export bakes this branch, so paid
  // course pages keep their authored cover in HTML for SEO/social and the
  // course-covers build gate. No lesson content ever renders here.
  const hero = (
    <section className="bg-navy py-10 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-amber mb-4"
        >
          <ArrowLeft size={14} /> All courses
        </Link>
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <CourseCover course={course} icon={course.icon ?? "📚"} title={course.title} size={1200} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
            {course.category && (
              <div className="text-[10px] font-bold tracking-widest uppercase text-amber mb-1">
                {course.category}
              </div>
            )}
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              {course.title}
            </h1>
          </div>
        </div>
        {course.description && <p className="text-white/60 text-sm mt-3">{course.description}</p>}
      </div>
    </section>
  );

  if (checking) {
    return (
      <main className="w-full">
        {hero}
        <section className="bg-light py-10 px-4 text-center">
          <div className="text-sm text-gray">Checking your access…</div>
        </section>
      </main>
    );
  }

  if (entitled) {
    if (!lessonsLoaded) {
      return (
        <main className="w-full">
          <section className="bg-light py-20 px-4 text-center">
            <div className="text-sm text-gray">Loading your course…</div>
          </section>
        </main>
      );
    }
    return <CourseViewer key={course.id} course={course} lessons={lessons} />;
  }

  return (
    <main className="w-full">
      {hero}

      <section className="bg-light py-10 sm:py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border border-border p-5 sm:p-6">
            <div className="flex items-center gap-2 text-amber-strong">
              <Lock size={16} />
              <span className="text-xs font-extrabold uppercase tracking-widest">Paid course</span>
            </div>
            <h2 className="text-lg font-extrabold text-navy mt-2">
              Get lifetime access for GH₵ {course.price_ghs}
            </h2>
            <p className="text-xs text-gray mt-1">
              One payment, permanent access — including every future lesson we add to this course.
            </p>
            {session && !entitled && (
              <div className="mt-2 flex items-center gap-1 text-[11px] text-gray">
                <Clock size={11} /> Unlocked immediately after MoMo confirms.
              </div>
            )}
            <CourseCheckout
              course={{ id: course.id, title: course.title, price_ghs: course.price_ghs }}
              onUnlocked={() => void checkAccess()}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
