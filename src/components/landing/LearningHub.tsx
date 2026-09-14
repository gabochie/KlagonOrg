?import { COURSES } from "@/lib/constants";

export function LearningHub() {
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
          {COURSES.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-border overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform"
            >
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
                <div className="text-xs text-gray mb-2.5">
                  {c.lessons} lessons · PDF + Video
                </div>
                <div className="h-1 bg-pale rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber transition-all"
                    style={{ width: `${(c.lessonsDone / c.lessons) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
