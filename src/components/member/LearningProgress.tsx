"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { MEMBER_COURSES } from "@/lib/constants";
import { fetchPublicCourses, fetchMyLessonProgress, isUuid } from "@/lib/queries";
import { DemoTag } from "@/components/ui";
import { CheckCircle } from "lucide-react";

const categoryColors: Record<string, string> = {
  "Future Skills": "#EEF2FF",
  Finance: "#FFF7E6",
  Leadership: "#ECFDF5",
  Entrepreneurship: "#FFF3F0",
  Communication: "#F0F9FF",
  Career: "#F0FDF4",
};

export function LearningProgress() {
  const { profile } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState(MEMBER_COURSES);
  const [subtitle, setSubtitle] = useState("2 active courses · 1 completed");
  const [demo, setDemo] = useState(true);

  useEffect(() => {
    void (async () => {
      const [liveCourses, lessonIds, getClient] = await Promise.all([
        fetchPublicCourses(),
        profile?.id ? fetchMyLessonProgress(profile.id) : Promise.resolve([]),
        import("@/lib/supabase-browser").then((m) => m.getBrowserClient),
      ]);
      if (liveCourses.length === 0) return;

      const c = getClient();
      if (!c) return;
      const { data: lessons } = await c.from("lessons").select("id, course_id");
      const doneByCourse = new Map<string, number>();
      if (lessons) {
        const lessonToCourse = new Map<string, string>(
          lessons.map((l) => [l.id, l.course_id])
        );
        for (const lid of lessonIds) {
          const cid = lessonToCourse.get(lid);
          if (cid) doneByCourse.set(cid, (doneByCourse.get(cid) ?? 0) + 1);
        }
      }

      const merged = liveCourses
        .map((cc) => ({
          ...cc,
          lessonsDone: Math.min(doneByCourse.get(cc.id) ?? 0, cc.lessons),
          color: categoryColors[cc.category] ?? cc.color,
        }))
        .slice(0, 3);

      const active = merged.filter((c) => c.lessonsDone > 0 && c.lessonsDone < c.lessons).length;
      const completed = merged.filter((c) => c.lessonsDone > 0 && c.lessonsDone >= c.lessons).length;
      setSubtitle(
        `${active} active course${active === 1 ? "" : "s"} · ${completed} completed`
      );
      setCourses(merged);
      setDemo(false);
    })();
  }, [profile?.id]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-navy flex items-center gap-2">
            Learning Progress {demo && <DemoTag />}
          </div>
          <div className="text-[11px] text-gray mt-0.5">{subtitle}</div>
        </div>
          <Link href="/dashboard/learning" className="text-[11px] font-bold text-blue cursor-pointer hover:underline">
            All Courses →
          </Link>
      </div>
      {courses.map((c) => {
        const pct = Math.round((c.lessonsDone / c.lessons) * 100);
        return (
          <div
            key={c.id}
            className="flex items-center gap-2.5 py-2 border-b border-border last:border-b-0"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
              style={{ background: c.color }}
            >
              {c.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-navy truncate">{c.title}</div>
              <div className="text-[10px] text-gray">
                Lesson {c.lessonsDone} of {c.lessons} · {pct}% done
              </div>
            </div>
            {pct === 100 ? (
              <span className="px-2 py-1 rounded-full bg-green/10 text-green-800 text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                <CheckCircle size="12" /> Certified
              </span>
            ) : (
              <div className="flex flex-col items-end gap-1">
                <div className="text-[11px] font-bold text-navy">{pct}%</div>
                <div className="w-20 h-1 bg-light rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: pct > 50 ? "#10B981" : "#F59E0B" }}
                  />
                </div>
                <button
                  onClick={() => {
                    if (isUuid(c.id)) router.push(`/dashboard/learning/${c.id}`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-navy text-white text-[10px] font-bold cursor-pointer whitespace-nowrap font-sans hover:bg-blue transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}