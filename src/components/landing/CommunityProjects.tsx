import { PROJECTS } from "@/lib/constants";

export function CommunityProjects() {
  return (
    <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-3">
          Community Projects
        </div>
        <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-navy tracking-tight leading-tight mb-2">
          Build things that actually help Klagon.
        </h2>
        <p className="text-sm text-gray leading-relaxed max-w-[500px] mb-10">
          Join active projects, volunteer your skills, and see the direct impact on your community â€”
          all tracked on your profile.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PROJECTS.map((p) => (
            <div key={p.id} className="border border-border rounded-xl p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: p.color }}
                >
                  {p.icon}
                </div>
                <div className="text-sm font-bold text-navy">{p.title}</div>
              </div>
              <span
                className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-2 ${
                  p.status === "active"
                    ? "bg-green/10 text-green-800"
                    : "bg-amber/10 text-amber-800"
                }`}
              >
                {p.status === "active" ? "Active" : "Recruiting"}
              </span>
              <p className="text-xs text-gray leading-relaxed mb-3">{p.description}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray">
                <span className="w-2 h-2 rounded-full bg-green" />
                {p.volunteers} volunteers Â· {p.spotsOpen} spots open
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
