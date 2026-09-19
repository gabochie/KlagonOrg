import Link from "next/link";

const DOORS = [
  {
    icon: "🧭",
    title: "Visit",
    text: "Guesthouses, local food, and things worth your trip — booked over WhatsApp.",
    href: "/visit",
  },
  {
    icon: "🎓",
    title: "Learn",
    text: "AI, tech, entrepreneurship, and leadership tracks. Free for members.",
    href: "/learning",
  },
  {
    icon: "🗺️",
    title: "See",
    text: "A living map of Klagon — projects, businesses, schools, and stays.",
    href: "/map",
  },
  {
    icon: "🏪",
    title: "Trade",
    text: "Classifieds and verified storefronts for local business.",
    href: "/classifieds",
  },
];

export function FourDoors() {
  return (
    <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-3">
          One Platform
        </div>
        <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-navy tracking-tight leading-tight mb-2">
          Four doors into Klagon.
        </h2>
        <p className="text-sm text-gray leading-relaxed mb-8 max-w-2xl">
          Whether you&apos;re visiting, learning, exploring, or doing business — start here.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {DOORS.map((d) => (
            <Link
              key={d.title}
              href={d.href}
              className="block bg-pale rounded-xl p-5 border border-border hover:border-navy hover:shadow-md transition-all"
            >
              <div className="text-2xl mb-2">{d.icon}</div>
              <div className="text-sm font-extrabold text-navy mb-1">{d.title}</div>
              <div className="text-xs text-gray leading-relaxed">{d.text}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
