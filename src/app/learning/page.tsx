import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { COURSES } from "@/lib/constants";
import { ProgressBar } from "@/components/ui";

const categoryColors: Record<string, string> = {
  "Future Skills": "#EEF2FF",
  Finance: "#FFF7E6",
  Leadership: "#ECFDF5",
  Entrepreneurship: "#FFF3F0",
  Communication: "#F0F9FF",
  Career: "#F0FDF4",
};

export default function LearningPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
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
            {COURSES.map((c) => {
              const pct = Math.round((c.lessonsDone / c.lessons) * 100);
              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div
                    className="h-20 flex items-center justify-center text-2xl"
                    style={{ background: categoryColors[c.category] ?? c.color }}
                  >
                    {c.icon}
                  </div>
                  <div className="p-5">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-amber mb-1.5">
                      {c.category}
                    </div>
                    <h3 className="text-sm font-bold text-navy leading-tight mb-1">{c.title}</h3>
                    <p className="text-xs text-gray mb-3">
                      {c.lessons} lessons · PDF + Video
                    </p>
                    <ProgressBar value={pct} color={pct > 0 ? "#F59E0B" : "#E2E8F0"} showLabel />
                    <button className="mt-3 w-full py-2 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer font-sans hover:bg-blue transition-colors">
                      {pct > 0 ? "Continue Learning →" : "Start Course →"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
