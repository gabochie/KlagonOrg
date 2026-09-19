import { BadgeCheck, Building2, Megaphone, BarChart3, GraduationCap, Handshake } from "lucide-react";

const BENEFITS_FOR_BUSINESS = [
  {
    icon: <Megaphone size="16" />,
    title: "Build a loyal customer base",
    body: "Verified KLAGON partner badge on your profile, card, and badged storefront puts your business in front of an engaged local audience that actively buys from sponsors.",
  },
  {
    icon: <BadgeCheck size="16" />,
    title: "Get verified & trusted",
    body: "A public verification badge, digital business certificate, and QR business card signal credibility — so customers, schools, and partners trust you instantly.",
  },
  {
    icon: <Handshake size="16" />,
    title: "Hire trained local talent",
    body: "Recruit directly from KLAGON.org's workshops and accelerated learning talent pool. Join the wall of businesses that give Klagon youth their first real opportunity.",
  },
  {
    icon: <Building2 size="16" />,
    title: "A full storefront, not a link",
    body: "Your own business profile, digital card, and badge page — with WhatsApp, directions, and contact in one tap. No website needed to look professional.",
  },
];

const BENEFITS_FOR_SPONSORS = [
  {
    icon: <GraduationCap size="16" />,
    title: "Shape tomorrow's workforce",
    body: "Co-design challenges and content with KLAGON's trained young talent, so the skills they build match what your business actually needs.",
  },
  {
    icon: <BarChart3 size="16" />,
    title: "Sponsor wall presence",
    body: "Featured placement on the public sponsor wall by tier — the founding, strategic, and innovation groups are front and centre with KLAGON.org.",
  },
];

export function DashboardPreview() {
  return (
    <section className="bg-pale py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-3">
          For Partners & Sponsors
        </div>
        <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-navy tracking-tight leading-tight mb-2">
          Benefits that build real partnership.
        </h2>
        <p className="text-sm text-gray leading-relaxed max-w-[500px] mb-8">
          KLAGON.org partnerships are built for local businesses and sponsors who want more than a logo —
          they want customers, talent, and a workforce for tomorrow.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb- pretends-8">
          <div className="lg:col-span-3">
            <div className="text-xs font-bold text-navy mb-3">For local businesses</div>
            <div className="grid sm:grid-cols-2 gap-3">
              {BENEFITS_FOR_BUSINESS.map((b) => (
                <div key={b.title} className="bg-white rounded-xl border border-border p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber/10 text-amber-strong flex items-center justify-center flex-shrink-0">
                    {b.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-navy mb-0.5">{b.title}</div>
                    <div className="text-[11px] text-gray leading-relaxed">{b.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="text-xs font-bold text-navy mb-3">For sponsors & partners</div>
            <div className="flex flex-col gap-3">
              {BENEFITS_FOR_SPONSORS.map((b) => (
                <div key={b.title} className="bg-white rounded-xl border border-border p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber/10 text-amber-strong flex items-center justify-center flex-shrink-0">
                    {b.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-navy mb-0.5">{b.title}</div>
                    <div className="text-[11px] text-gray leading-relaxed">{b.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
