import { JOURNEY_STAGES } from "@/lib/constants";

export function JourneyPath() {
  return (
    <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-3">
          Your Path
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-8 sm:gap-12 items-start">
          <div>
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-navy tracking-tight leading-tight mb-2">
              From curious<br />to leading your community.
            </h2>
            <p className="text-sm text-gray leading-relaxed max-w-[500px]">
              KlagonOrg gives every young person in Klagon a clear, supported roadmap â€” from the moment
              they show up, to the day they&apos;re mentoring the next person behind them.
            </p>
          </div>
          <div className="flex items-center gap-0 overflow-x-auto pb-4" tabIndex={0} role="region" aria-label="Learning journey">
            {JOURNEY_STAGES.map((stage, i) => (
              <>
                <div key={stage.id} className="flex flex-col items-center min-w-[100px]">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xl relative mb-2.5 ${
                      stage.state === "done"
                        ? "bg-pale"
                        : stage.state === "current"
                          ? "bg-amber/20"
                          : "bg-pale"
                    }`}
                  >
                    {stage.icon}
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-amber flex items-center justify-center text-[10px] font-bold text-navy">
                      {stage.id}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-navy text-center">{stage.name}</div>
                  <div className="text-[11px] text-gray text-center mt-0.5 max-w-[90px]">
                    {stage.subtitle}
                  </div>
                </div>
                {i < JOURNEY_STAGES.length - 1 && (
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-amber to-green opacity-40 min-w-[16px] -mt-8" />
                )}
              </>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
