import Link from "next/link";

const platformLinks = [
  { label: "Events", href: "/events" },
  { label: "Learning Hub", href: "/learning" },
  { label: "Community Projects", href: "/projects" },
  { label: "Volunteer", href: "/volunteer" },
  { label: "News", href: "/news" },
];

const joinLinks = [
  { label: "Register Now", href: "/auth/register" },
  { label: "Become a Mentor", href: "/mentor" },
  { label: "Sponsor KlagonStudios", href: "/sponsor" },
  { label: "Donate", href: "/donate" },
];

const connectLinks = [
  { label: "WhatsApp Community", href: "https://chat.whatsapp.com/KlagonStudios", external: true },
  { label: "YouTube", href: "https://youtube.com/@KlagonStudios", external: true },
  { label: "TikTok", href: "https://tiktok.com/@KlagonStudios", external: true },
  { label: "Instagram", href: "https://instagram.com/KlagonStudios", external: true },
  { label: "Facebook", href: "https://facebook.com/KlagonStudios", external: true },
  { label: "Contact Us", href: "/contact", external: false },
];

export function Footer() {
  return (
    <footer className="bg-navy py-10 sm:py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber flex items-center justify-center text-xs font-extrabold text-navy">
                KS
              </div>
              <span className="text-sm font-bold text-white">KlagonStudios</span>
            </Link>
            <p className="text-xs text-white/50 leading-relaxed max-w-[200px]">
              Preparing Klagon&apos;s youth for the future — through skills, community, and
              opportunity.
            </p>
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-white/40 mb-3">
              Platform
            </div>
            {platformLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block text-xs text-white/60 hover:text-amber mb-2 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-white/40 mb-3">
              Join
            </div>
            {joinLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="block text-xs text-white/60 hover:text-amber mb-2 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div>
            <div className="text-[11px] font-bold tracking-widest uppercase text-white/40 mb-3">
              Connect
            </div>
            {connectLinks.map((l) =>
              l.external ? (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-white/60 hover:text-amber mb-2 transition-colors"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  className="block text-xs text-white/60 hover:text-amber mb-2 transition-colors"
                >
                  {l.label}
                </Link>
              )
            )}
          </div>
        </div>
        <div className="border-t border-white/10 pt-5 flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs text-white/35">
            © 2025 KlagonStudios. All rights reserved.
          </div>
          <div className="text-[11px] font-semibold bg-amber/15 text-amber px-2.5 py-1 rounded-full">
            Built for Klagon, Ghana 🇬🇭
          </div>
        </div>
      </div>
    </footer>
  );
}
