?import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { ProgressBar } from "@/components/ui";
import { COURSES } from "@/lib/constants";
import { getSupabase } from "@/lib/supabase";
import type { Course } from "@/types";

export const metadata: Metadata = {
  title: "Learning Hub — KlagonOrg",
  description:
    "Free learning tracks in AI & Tech, Financial Literacy, Leadership, Entrepreneurship, Communication and Career Planning.",
  alternates: { canonical: "/learning" },
};

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
      .select("id,title,category,icon,lesson_count")
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) return COURSES;
    return data.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      icon: r.icon,
      lessons: r.lesson_count,
      lessonsDone: 0,
      color: "#EEF2FF",
    }));
  } catch {
    return COURSES;
  }
}

export default async function LearningPage() {
  const courses = await getCourses();

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
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
              const pct = Math.round((c.lessonsDone / c.lessons) * 100);
              return (
                <Link
                  key={c.id}
                  href={`/learning/${c.id}`}
                  className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer block"
                >
                  <div
                    className="h-20 flex items-center justify-center text-2xl"
                    style={{ background: categoryColors[c.category] ?? c.color }}
                  >
                    {c.icon}
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-1.5">
                      {c.category}
                    </div>
                    <h2 className="text-sm font-bold text-navy leading-tight mb-1">{c.title}</h2>
                    <p className="text-xs text-gray mb-3">
                      {c.lessons} lessons · PDF + Video
                    </p>
                    <ProgressBar value={pct} color={pct > 0 ? "#F59E0B" : "#E2E8F0"} showLabel />
                    <span className="mt-3 w-full block py-2 rounded-lg bg-navy text-white text-xs font-bold font-sans group-hover:bg-blue transition-colors text-center">
                      {pct > 0 ? "Continue Learning →" : "Start Course →"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}