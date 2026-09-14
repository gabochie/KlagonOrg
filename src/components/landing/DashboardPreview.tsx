export function DashboardPreview() {
  return (
    <section className="bg-pale py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-3">
          Member Dashboard
        </div>
        <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-navy tracking-tight leading-tight mb-2">
          Everything you need, in one place.
        </h2>
        <p className="text-sm text-gray leading-relaxed max-w-[500px] mb-8">
          Track your progress, RSVP to events, join projects, and manage your KlagonOrg journey from your
          personal dashboard.
        </p>
        <div className="bg-white rounded-xl border border-border overflow-hidden shadow-sm">
          <div className="bg-navy px-4 sm:px-6 py-3 flex items-center justify-between">
            <span className="text-white text-sm font-bold">KlagonOrg Member Dashboard</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center text-xs font-bold text-navy">
                AK
              </div>
              <span className="text-white/70 text-xs">Ama Kofi</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
            <div className="border-r border-pale py-2 hidden sm:block">
              {["Overview", "Events", "Learning", "Projects", "Volunteer", "Messages", "Profile"].map(
                (item, i) => (
                  <div
                    key={item}
                    className={`px-5 py-2 text-xs font-medium cursor-pointer flex items-center gap-2 ${
                      i === 0
                        ? "bg-pale text-navy font-bold border-r-3 border-amber"
                        : "text-gray"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-gray" />
                    {item}
                  </div>
                ),
              )}
            </div>
            <div className="p-5">
              <div className="text-sm font-bold text-navy mb-1">Welcome back, Ama! ðŸ‘‹</div>
              <div className="text-xs text-gray mb-4">Saturday, 12 July 2025</div>
              <div className="grid grid-cols-3 gap-2.5 mb-4">
                {[
                  { val: "3", label: "Events attended" },
                  { val: "60%", label: "Fin. Literacy done" },
                  { val: "1", label: "Projects joined" },
                ].map((m) => (
                  <div key={m.label} className="bg-pale rounded-lg p-3">
                    <div className="text-xl font-extrabold text-navy">{m.val}</div>
                    <div className="text-[11px] text-gray mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="bg-amber/10 rounded-lg p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber flex items-center justify-center text-base flex-shrink-0">
                  ðŸ“…
                </div>
                <div>
                  <div className="text-xs font-bold text-navy">
                    Next: Automate 3 Tasks at Work with AI — Sat, 12 July · 10:00 AM
                  </div>
                  <div className="text-[11px] text-gray mt-0.5">
                    Community Hall, Klagon · 12 seats remaining
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
