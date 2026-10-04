import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { COURSES } from "@/lib/constants";
import { CourseCover } from "@/components/learning/CourseCover";

const categoryColors: Record<string, string> = {
  "Future Skills": "#EEF2FF",
  Finance: "#FFF7E6",
  Leadership: "#ECFDF5",
  Entrepreneurship: "#FFF3F0",
  Communication: "#F0F9FF",
  Career: "#F0FDF4",
};

type HubCourse = {
  id: string;
  title: string;
  category: string;
  icon: string;
  cover_url: string | null;
  lessons: number;
  color: string;
};

async function getCourses(): Promise<{ courses: HubCourse[]; linked: boolean }> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("courses_public")
      .select("id,title,category,icon,cover_url,lesson_count")
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) throw new Error("empty");
    return {
      linked: true,
      courses: data.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        icon: r.icon,
        cover_url: r.cover_url ?? null,
        lessons: r.lesson_count,
        color: categoryColors[r.category] ?? "#EEF2FF",
      })),
    };
  } catch {
    return {
      linked: false,
      courses: COURSES.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        icon: c.icon,
        cover_url: c.cover_url ?? null,
        lessons: c.lessons,
        color: c.color,
      })),
    };
  }
}

export async function LearningHub() {
  const { courses, linked } = await getCourses();

  return (
    <section className="bg-pale py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* KLAGON.org is the platform; the Academy is one part of it, so this is
            a small crest beside the name rather than a hero. The plaque is
            bg-[#FFFFFF] rather than bg-white because globals.css maps
            .dark .bg-white to the navy ink colour, which would swallow the crest
            in dark mode — same constraint as the /learning hero. */}
        <div className="flex items-start gap-4 mb-4">
          <div className="shrink-0 w-[56px] sm:w-[64px] rounded-xl bg-[#FFFFFF] p-1.5 ring-1 ring-black/5 shadow-sm">
            <img
              src="/brand/learning/klagon-digital-academy-crest-160.webp"
              alt="Klagon Digital Academy crest"
              width={160}
              height={177}
              loading="lazy"
              decoding="async"
              className="w-full h-auto"
            />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-2">
              Klagon Digital Academy
            </div>
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-navy tracking-tight leading-tight mb-2">
              Skills that open doors.
            </h2>
          </div>
        </div>
        <p className="text-sm text-gray leading-relaxed max-w-[500px] mb-6">
          Structured short courses built for Klagon youth — no laptop required to start. Each module
          takes you from zero to confident.
        </p>
        <Link
          href="/learning"
          className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-bold bg-navy text-white dark:bg-amber dark:text-navy hover:opacity-90 transition-opacity mb-10 min-h-11 sm:min-h-13"
        >
          Visit the Academy →
        </Link>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {courses.map((c) => {
            const card = (
              <>
                <div
                  className="aspect-video flex items-center justify-center text-2xl overflow-hidden"
                  style={{ background: c.color }}
                >
                  <CourseCover course={c} icon={c.icon} title={c.title} />
                </div>
                <div className="p-3 sm:p-4">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-1.5">
                    {c.category}
                  </div>
                  <div className="text-sm font-bold text-navy leading-tight mb-1">{c.title}</div>
                  <div className="text-xs text-gray">{c.lessons} lessons · PDF + Video</div>
                </div>
              </>
            );
            const cls =
              "bg-white rounded-xl border border-border overflow-hidden block hover:-translate-y-0.5 transition-transform";
            return linked ? (
              <Link key={c.id} href={`/learning/${c.id}`} className={cls}>
                {card}
              </Link>
            ) : (
              <div key={c.id} className={cls}>
                {card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
