import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SalesCta } from "@/components/go/SalesCta";

export const metadata: Metadata = {
  title: "AI Team Sprint — Train 5 Staff in 2 Weeks",
  description:
    "Done-with-you AI productivity sprint for Klagon SMEs: 5 staff seats, on-site kickoff, 3 live automations per staffer, manager dashboard + verified business badge. GH₵2,000 flat. WhatsApp concierge.",
  alternates: { canonical: "/go/ai-sprint-team" },
  openGraph: {
    type: "website",
    url: "/go/ai-sprint-team",
    siteName: "KLAGON.org",
    title: "AI Team Sprint — Train 5 Staff in 2 Weeks",
    description:
      "5 seats, on-site kickoff, 3 automations each, manager report + badge. GH₵2,000 flat. Built for Ghanaian SMEs.",
  },
};

export default function AiSprintTeamPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-amber/8 pointer-events-none" />
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-14 sm:py-20">
            <div className="inline-flex items-center gap-2 bg-amber/15 border border-amber/30 text-amber px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber" />
              For Klagon SMEs · 5 staff · 2 weeks · Done-with-you
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.12] tracking-tight mb-3 max-w-3xl">
              Your staff waste 10+ hours a week on work AI already does.
            </h1>
            <p className="text-lg font-bold text-amber mb-3">We fix that in 2 weeks — inside your business, on their phones.</p>
            <p className="text-base text-white/65 leading-relaxed max-w-[560px] mb-8">
              Quotations, customer follow-ups, stock sheets, daily reports. We train{" "}
              <span className="text-white font-bold">5 of your people</span> to automate 3
              tasks each, prove the hours saved, and hand you a manager report you can act on.
            </p>
            <SalesCta source="ai-sprint-team" secondaryHref="#offer" label="Book the Team Sprint" price={2000} />
            <p className="text-white/50 text-xs mt-4">
              GH₵2,000 flat for 5 staff · On-site kickoff in Klagon / Lashibi / Tema · MoMo or invoice · Verified badge included
            </p>
          </div>
        </section>

        <section id="offer" className="bg-light py-12 px-4 sm:px-6 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-2">What your GH₵2,000 buys</h2>
            <p className="text-sm text-gray text-center mb-8 max-w-lg mx-auto">
              Not training videos. Working automations, installed in your business, with proof.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { e: "🚀", t: "On-site kickoff (2 hrs)", d: "We come to you. Map your 3 costliest repeat tasks with your team. Phones only." },
                { e: "👥", t: "5 seats, guided daily", d: "20 min/day for 2 weeks. WhatsApp support group + one live troubleshooting call." },
                { e: "📊", t: "Manager report", d: "Hours saved per staffer, errors cut, next 3 tasks to automate. Presented to you in week 3." },
                { e: "🏅", t: "Verified badge + listing", d: "KLAGON Verified Business badge, directory feature + first access to trained youth hires." },
              ].map((c) => (
                <div key={c.t} className="bg-white rounded-2xl border border-border p-5">
                  <div className="text-2xl mb-2">{c.e}</div>
                  <h3 className="text-sm font-extrabold text-navy mb-1">{c.t}</h3>
                  <p className="text-xs text-gray leading-relaxed">{c.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 max-w-2xl mx-auto bg-white rounded-2xl border border-amber/40 p-6 text-center">
              <div className="text-xs font-bold tracking-widest uppercase text-amber mb-1">The maths owners care about</div>
              <p className="text-sm text-navy leading-relaxed">
                If each staffer saves <span className="font-extrabold">3 hrs/week</span> at{" "}
                <span className="font-extrabold">GH₵25/hr</span>, that&apos;s{" "}
                <span className="font-extrabold">GH₵1,500/month</span> back for a{" "}
                <span className="font-extrabold">GH₵2,000</span> one-time sprint — paid back in ~6 weeks.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-6">How the 2 weeks run</h2>
            <ol className="flex flex-col gap-3">
              {[
                { n: "Day 1", t: "Kickoff at your shop", d: "Task audit, pick 3 automations, set up phones + accounts safely." },
                { n: "Days 2–8", t: "Build sprint", d: "Staff follow guided lessons; daily WhatsApp check-in; we unblock same-day." },
                { n: "Days 9–14", t: "Go-live week", d: "All 3 automations run on real work. Time-saved log kept per staffer." },
                { n: "Week 3", t: "Manager handover", d: "You get the report + next-steps plan. Badges + directory feature go live." },
              ].map((s) => (
                <li key={s.n} className="flex gap-4 bg-light rounded-xl border border-border p-4">
                  <span className="text-xs font-extrabold text-amber-strong bg-amber/10 rounded-lg px-2.5 py-1 h-fit whitespace-nowrap">{s.n}</span>
                  <span>
                    <span className="block text-sm font-extrabold text-navy">{s.t}</span>
                    <span className="block text-xs text-gray mt-1 leading-relaxed">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-8 text-center bg-navy rounded-2xl p-6">
              <div className="text-sm font-extrabold text-white mb-1">Only 4 team slots per month</div>
              <p className="text-xs text-white/60 mb-4">We deliver kickoffs ourselves — when the month fills, you join the waitlist.</p>
              <div className="flex justify-center">
                <SalesCta source="ai-sprint-team" secondaryHref="/sponsor" label="Claim your slot" price={2000} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
