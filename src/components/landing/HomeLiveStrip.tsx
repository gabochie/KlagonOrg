import Link from "next/link";

const ITEMS = [
  {
    icon: "📰",
    label: "News",
    text: "Local stories and updates straight from Klagon.",
    href: "/news",
  },
  {
    icon: "💼",
    label: "Jobs",
    text: "Jobs, gigs, apprenticeships and internships nearby.",
    href: "/jobs",
  },
  {
    icon: "📅",
    label: "Events",
    text: "Workshops, cleanups and community meet-ups.",
    href: "/events",
  },
  {
    icon: "🗺️",
    label: "Map",
    text: "Places, businesses and community needs on one map.",
    href: "/map",
  },
];

export function HomeLiveStrip() {
  return (
    <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-1.5">
          What&apos;s happening
        </div>
        <h2 className="text-[clamp(1.4rem,2.4vw,1.8rem)] font-extrabold text-navy tracking-tight leading-tight mb-6">
          Klagon is moving.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-light rounded-xl border border-border p-5 hover:border-navy/20 hover:bg-pale transition-colors"
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="text-sm font-extrabold text-navy group-hover:underline">
                {item.label}
              </div>
              <p className="text-xs text-gray leading-relaxed mt-1.5">{item.text}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}