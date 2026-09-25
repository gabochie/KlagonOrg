import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { COURSES } from "@/lib/constants";
import { CourseCover } from "@/components/learning/CourseCover";
import type { Course } from "@/types";

const categoryColors: Record<string, string> = {
  "Future Skills": "#EEF2FF",
  Finance: "#FFF7E6",
  Leadership: "#ECFDF5",
  Entrepreneurship: "#FFF3F0",
  Communication: "#F0F9FF",
  Career: "#F0FDF4",
};

async function getCourses(): Promise<Course[]> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("courses_public")
      .select("id,title,category,icon,cover_url,lesson_count")
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return COURSES;
    return data.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      icon: r.icon,
      cover_url: r.cover_url ?? null,
      lessons: r.lesson_count,
      lessonsDone: 0,
      color: "#EEF2FF",
    }));
  } catch {
    return COURSES;
  }
}

export async function LearningHubContent() {
  const courses = await getCourses();

  return (
    <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Learning Hub
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Skills that open doors.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Structured short courses built for Klagon youth — no laptop required to start. Each
            module takes you from zero to confident.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => {
              // NOTE: this grid is a public server component with no member
              // context, so per-learner progress cannot be shown here. Per-course
              // progress lives on the course page itself. Do not render a
              // hardcoded 0% — it reads as broken after completing lessons.
              return (
                <Link
                  key={c.id}
                  href={`/learning/${c.id}`}
                  className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer block"
                >
                  <div
                    className="h-20 flex items-center justify-center text-2xl overflow-hidden"
                    style={{ background: categoryColors[c.category] ?? c.color }}
                  >
                    <CourseCover coverUrl={c.cover_url} icon={c.icon} title={c.title} />
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-1.5">
                      {c.category}
                    </div>
                    <h2 className="text-sm font-extrabold text-navy group-hover:text-blue transition-colors leading-snug">
                      {c.title}
                    </h2>
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-gray">
                      <span>{c.lessons} lessons</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}