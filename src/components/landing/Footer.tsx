import Link from "next/link";

const platformLinks = [
  { label: "Events", href: "/events" },
  { label: "Learning Hub", href: "/learning" },
  { label: "Blog", href: "/blog" },
  { label: "Community Projects", href: "/projects" },
  { label: "Volunteer", href: "/volunteer" },
  { label: "News", href: "/news" },
];

const joinLinks = [
  { label: "Register Now", href: "/auth/register" },
  { label: "Become a Mentor", href: "/mentor" },
  { label: "Sponsor KlagonOrg", href: "/sponsor" },
  { label: "Donate", href: "/donate" },
];

const contactLinks = [
  { label: "Contact Us", href: "/contact", external: false },
  { label: "hello@klagon.org", href: "mailto:hello@klagon.org", external: false },
  { label: "+233 26 870 8895", href: "https://wa.me/233268708895", external: true },
];

const socials = [
  {
    label: "WhatsApp",
    href: "https://wa.me/233268708895",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    ),
  },
  ];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="bg-navy py-10 sm:py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 mb-8">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-2.5">
              <img
                src="/brand/klagon-logo.png"
                alt="KlagonOrg"
                className="h-11 w-auto rounded-lg"
              />
              <span className="text-base font-extrabold tracking-tight text-white">
                KLAGON<span className="text-amber">org</span>
              </span>
            </Link>
            <p className="text-xs text-white/50 leading-relaxed max-w-[200px]">
              Preparing Klagon&apos;s youth for the future — through skills, community, and
              opportunity.
            </p>
            <div className="flex items-center gap-2 mt-4">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  title={s.label}
                  className="w-9 h-9 rounded-lg bg-white/8 border border-white/12 flex items-center justify-center text-white/60 hover:text-navy hover:bg-amber transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
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
              Contact
            </div>
            {contactLinks.map((l) =>
              l.external ? (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  suppressHydrationWarning={l.href.startsWith("mailto:")}
                  className="block text-xs text-white/60 hover:text-amber mb-2 transition-colors"
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  suppressHydrationWarning={l.href.startsWith("mailto:")}
                  className="block text-xs text-white/60 hover:text-amber mb-2 transition-colors"
                >
                  {l.label}
                </Link>
              )
            )}
          </div>
        </div>
        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-white/35">
            © 2026 KlagonOrg. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            {legalLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="text-xs text-white/50 hover:text-amber transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="text-[11px] font-semibold bg-amber/15 text-amber px-2.5 py-1 rounded-full">
            Built for Klagon, Ghana 🇬🇭
          </div>
        </div>
      </div>
    </footer>
  );
}