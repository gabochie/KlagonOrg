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
      .select("id,title,category,icon,cover_url,lesson_count,price_ghs")
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
      price_ghs: r.price_ghs ?? null,
    }));
  } catch {
    return COURSES;
  }
}

export async function LearningHubContent() {
  const courses = await getCourses();

  return (
    <main className="w-full">
      {/* Crest sits on a white plaque on purpose: the artwork is predominantly deep
          navy (median rgb 0,30,68) and vanishes against the navy hero. The plaque
          also restores the white ground the crest was drawn on without shipping the
          source's soft grey shadow ring (see public/brand/learning).

          The plaque is an explicit hex, not `bg-white`: globals.css flips
          `.dark .bg-white` to --color-ink-2 (#0E1732) site-wide, which put a
          near-black ground behind a navy crest in dark mode and lost it again.
          Same reason the WhatsApp buttons use bg-[#25D366]. */}
      <section className="bg-navy relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-amber/8 pointer-events-none" />
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(260px,340px)_1fr] gap-10 md:gap-12 items-center">
            <div className="w-full max-w-[280px] sm:max-w-[320px] mx-auto md:mx-0">
              <div className="rounded-2xl bg-[#FFFFFF] p-5 ring-1 ring-black/5 shadow-xl">
                <img
                  src="/brand/learning/klagon-digital-academy-crest-512.webp"
                  alt="Klagon Digital Academy crest"
                  width={464}
                  height={512}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-amber/15 border border-amber/30 text-amber px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                Free short courses
              </div>
              <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.15] tracking-tight mb-3">
                Klagon Digital Academy
              </h1>
              <p className="text-lg font-bold text-amber mb-3">Skills that open doors.</p>
              <p className="text-base text-white/65 leading-relaxed max-w-[520px] mx-auto md:mx-0 mb-8">
                Structured short courses built for Klagon youth — no laptop required to start. Each
                module takes you from zero to confident.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <a
                  href="#courses"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg px-6 py-3 text-sm max-sm:min-h-13 bg-amber text-navy font-bold hover:shadow-lg hover:shadow-amber/35 hover:-translate-y-0.5 transition-all duration-150"
                >
                  Browse the courses →
                </a>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg px-6 py-3 text-sm max-sm:min-h-13 bg-white/8 text-white/85 border border-white/15 hover:bg-white/12 transition-all duration-150"
                >
                  Create a free account →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="courses" className="bg-light py-14 sm:py-16 px-4 sm:px-6">
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
                    className="aspect-video flex items-center justify-center text-2xl overflow-hidden"
                    style={{ background: categoryColors[c.category] ?? c.color }}
                  >
                    <CourseCover course={c} icon={c.icon} title={c.title} />
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-1.5">
                      {c.category}
                    </div>
                    <h2 className="text-sm font-extrabold text-navy group-hover:text-blue transition-colors leading-snug">
                      {c.title}
                    </h2>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-gray">
                      <span>{c.lessons} lessons</span>
                      {typeof c.price_ghs === "number" && c.price_ghs > 0 ? (
                        <span className="font-extrabold text-amber-strong">GH₵ {c.price_ghs}</span>
                      ) : (
                        <span className="font-bold text-green-700">Free</span>
                      )}
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