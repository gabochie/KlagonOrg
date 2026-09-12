import { VALUE_PROPS } from "@/lib/constants";

export function ValueProps() {
  return (
    <section className="bg-pale py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">Why KlagonOrg</div>
        <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-navy tracking-tight leading-tight mb-2">
          Not just another youth group.
        </h2>
        <p className="text-sm text-gray leading-relaxed max-w-[500px] mb-10">
          A structured system designed to take you from where you are to where you deserve to be —
          with a community backing every step.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {VALUE_PROPS.map((v) => (
            <div
              key={v.title}
              className="bg-white rounded-xl border border-border p-5 hover:shadow-sm transition-shadow"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ background: v.bg }}
              >
                {v.icon}
              </div>
              <h3 className="text-sm font-bold text-navy mb-1.5">{v.title}</h3>
              <p className="text-xs text-gray leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
