import Link from "next/link";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/learning", label: "Learning" },
  { href: "/mentor", label: "Mentorship" },
  { href: "/contact", label: "Contact" },
];

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-light via-pale to-light px-4 py-12">
      <div className="text-center max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-7">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-navy to-blue flex items-center justify-center text-white text-sm font-extrabold shadow-md">
            KO
          </div>
          <span className="text-sm font-bold text-navy">KLAGON.org</span>
        </div>
        <div className="text-[92px] leading-none font-extrabold bg-gradient-to-br from-navy via-blue to-amber bg-clip-text text-transparent drop-shadow-sm mb-3">
          404
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber/15 border border-amber/30 px-3.5 py-1 mb-4">
          <span className="text-sm">🧭</span>
          <span className="text-[11px] font-extrabold text-amber-strong uppercase tracking-wider">
            Wrong turn
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-navy mb-3">
          This page wandered off
        </h1>
        <p className="text-sm text-gray mb-8 leading-relaxed max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          No worries — let&apos;s get you back somewhere useful.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors shadow-sm mb-8"
        >
          ← Back to Home
        </Link>
        <div className="flex flex-wrap justify-center gap-2">
          {quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3.5 py-1.5 rounded-full bg-white border border-border text-xs font-bold text-navy hover:border-amber hover:text-amber-strong transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}