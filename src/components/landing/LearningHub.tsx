import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { COURSES } from "@/lib/constants";

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
  lessons: number;
  color: string;
};

async function getCourses(): Promise<{ courses: HubCourse[]; linked: boolean }> {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from("courses_public")
      .select("id,title,category,icon,lesson_count")
      .order("created_at", { ascending: true });
    if (error || !data || data.length === 0) throw new Error("empty");
    return {
      linked: true,
      courses: data.map((r) => ({
        id: r.id,
        title: r.title,
        category: r.category,
        icon: r.icon,
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
        <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-3">
          Learning Hub
        </div>
        <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-navy tracking-tight leading-tight mb-2">
          Skills that open doors.
        </h2>
        <p className="text-sm text-gray leading-relaxed max-w-[500px] mb-10">
          Structured short courses built for Klagon youth — no laptop required to start. Each module
          takes you from zero to confident.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {courses.map((c) => {
            const card = (
              <>
                <div
                  className="h-20 flex items-center justify-center text-2xl"
                  style={{ background: c.color }}
                >
                  {c.icon}
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
