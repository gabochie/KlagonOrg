import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SalesCta } from "@/components/go/SalesCta";

export const metadata: Metadata = {
  title: "AI Productivity Sprint — Automate 3 Tasks at Work",
  description:
    "A 2-week, phone-only sprint for Klagon youth, jobseekers and freelancers. Automate 3 real tasks with AI, ship a blueprint portfolio piece, earn a certificate. GH₵150 one-time, MoMo, lifetime access.",
  alternates: { canonical: "/go/ai-sprint" },
  openGraph: {
    type: "website",
    url: "/go/ai-sprint",
    siteName: "KLAGON.org",
    title: "AI Productivity Sprint — Automate 3 Tasks at Work",
    description:
      "Phone-only. 2 weeks. 3 live automations + certificate. Built for Ghana — MoMo fraud, data costs, offline mode included. GH₵150 one-time.",
  },
};

const LESSONS = [
  { n: "01", t: "Pick 3 tasks worth automating", d: "Time-audit your week, score tasks on frequency × pain, choose 3 with real payoff. MoMo reconciliation, follow-ups, reports." },
  { n: "02", t: "Prompt like a supervisor, not a beggar", d: "Role → task → constraints → format. Templates for quotations, CVs, proposals, customer replies. Safety + hallucination checks." },
  { n: "03", t: "Build your 3-task blueprint", d: "Free/mobile tools only. WhatsApp + Docs + Sheets + free AI. Step-by-step setup, screenshots, fallback when data runs out." },
  { n: "04", t: "Go live + measure hours saved", d: "Run all 3 for 7 days. Log time saved, errors caught, money impact. Fix what breaks in public." },
  { n: "05", t: "Showcase + certificate", d: "Publish your blueprint, record a 2-min demo, earn the Skills Passport badge + shareable certificate for CVs and clients." },
];

const FAQS = [
  { q: "No laptop — can I still do this?", a: "Yes. The whole sprint is phone-only and low-data. Every tool has a free tier and an offline fallback. If you can use WhatsApp, you can do this." },
  { q: "I have never used AI. Is this too advanced?", a: "No. Lesson 1 assumes zero AI experience. You start with tasks you already do, then add AI one step at a time. SOT-DIG-01 (digital basics) is included free as a pre-lesson." },
  { q: "How do I pay?", a: "Mobile Money — MTN, Telecel or AT. GH₵150 one-time, lifetime access including all future lessons. Pay on the course page after free signup; access unlocks the second MoMo confirms." },
  { q: "What do I walk away with?", a: "3 live automations, a written blueprint you can show employers/clients, a 2-min demo video, and a verifiable certificate (checkable at klagon.org/verify, issued within 48h of passing review) + Skills Passport badge." },
  { q: "What if it doesn't work for me?", a: "Do all 5 lessons + the project inside 14 days. If you show your work and still saved zero hours, WhatsApp us and we refund you. No forms, no fight." },
];

export default function AiSprintSalesPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-amber/8 pointer-events-none" />
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-14 sm:py-20">
            <div className="inline-flex items-center gap-2 bg-amber/15 border border-amber/30 text-amber px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber" />
              Klagon Digital Academy · 2-week sprint · Phone-only
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.12] tracking-tight mb-3 max-w-3xl">
              Automate 3 tasks at work with AI — in 2 weeks, on your phone.
            </h1>
            <p className="text-lg font-bold text-amber mb-3">Stop doing by hand what AI can draft, remind and reconcile.</p>
            <p className="text-base text-white/65 leading-relaxed max-w-[560px] mb-8">
              Built for Klagon youth, jobseekers, freelancers and shop staff. No laptop. No
              jargon. You leave with <span className="text-white font-bold">3 live automations</span>,
              a portfolio blueprint and a certificate employers can verify.
            </p>
            <SalesCta source="ai-sprint-b2c" secondaryHref="#curriculum" label="Enrol in the sprint" price={150} courseId="d65e71c1-d194-4352-a183-7f8133b9967a" />
            <p className="text-white/50 text-xs mt-4">
              GH₵150 one-time · MoMo (MTN / Telecel / AT) · Lifetime access · 14-day work-or-refund promise
            </p>
          </div>
        </section>

        <section className="bg-light py-12 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { e: "⏱️", t: "Save 3–5 hrs / week", d: "Follow-ups, quotations, stock sheets, reports — timed before and after, so you can prove it." },
              { e: "📱", t: "Phone-only, low-data", d: "Free tools, offline fallbacks, data-cost tips. Includes MoMo-fraud + privacy lesson for Ghana." },
              { e: "🎖️", t: "Proof, not just lessons", d: "Blueprint + demo video + certificate + Skills Passport badge for your CV and WhatsApp catalogue." },
            ].map((c) => (
              <div key={c.t} className="bg-white rounded-2xl border border-border p-5">
                <div className="text-2xl mb-2">{c.e}</div>
                <h3 className="text-sm font-extrabold text-navy mb-1">{c.t}</h3>
                <p className="text-xs text-gray leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="curriculum" className="bg-white py-14 px-4 sm:px-6 scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-2 text-center">What you build</div>
            <h2 className="text-2xl font-extrabold text-navy text-center tracking-tight mb-2">5 lessons. 3 automations. 1 blueprint.</h2>
            <p className="text-sm text-gray text-center mb-8">About 20 minutes a lesson + one real task per day. Evenings-friendly.</p>
            <ol className="flex flex-col gap-3">
              {LESSONS.map((l) => (
                <li key={l.n} className="flex gap-4 bg-light rounded-xl border border-border p-4">
                  <span className="text-xs font-extrabold text-amber-strong bg-amber/10 rounded-lg px-2.5 py-1 h-fit">{l.n}</span>
                  <span>
                    <span className="block text-sm font-extrabold text-navy">{l.t}</span>
                    <span className="block text-xs text-gray mt-1 leading-relaxed">{l.d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-xl bg-navy p-5 text-center">
              <div className="text-sm font-extrabold text-white mb-1">Final project: your 3-task automation blueprint</div>
              <p className="text-xs text-white/60 mb-4">Reviewed within 48 hours. Pass = verifiable certificate + badge. Fail = personal feedback + one free retry.</p>
              <SalesCta source="ai-sprint-b2c" secondaryHref="#faq" label="Start Lesson 1 free" />
            </div>
          </div>
        </section>

        <section className="bg-light py-14 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-6">Who this is for (and not for)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-green-200 p-5">
                <div className="text-sm font-extrabold text-green-800 mb-2">✓ Perfect if you…</div>
                <ul className="text-xs text-gray flex flex-col gap-1.5 leading-relaxed">
                  <li>· Do repeat admin: quotes, follow-ups, records, reports</li>
                  <li>· Hunt jobs or freelance clients and need proof of skill</li>
                  <li>· Run a shop/salon/school and lose hours to paperwork</li>
                  <li>· Own only a phone + small data bundle</li>
                </ul>
              </div>
              <div className="bg-white rounded-xl border border-red-100 p-5">
                <div className="text-sm font-extrabold text-red-700 mb-2">✕ Skip if you…</div>
                <ul className="text-xs text-gray flex flex-col gap-1.5 leading-relaxed">
                  <li>· Want coding / machine-learning theory (this is applied use)</li>
                  <li>· Won&apos;t do 20 min/day for 2 weeks</li>
                  <li>· Need a laptop-only advanced automation stack</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-white py-14 px-4 sm:px-6 scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-6">Questions, answered honestly</h2>
            <div className="flex flex-col gap-3">
              {FAQS.map((f) => (
                <details key={f.q} className="bg-light rounded-xl border border-border p-4">
                  <summary className="text-sm font-extrabold text-navy cursor-pointer">{f.q}</summary>
                  <p className="text-xs text-gray mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 text-center">
              <SalesCta source="ai-sprint-b2c" secondaryHref="/learning" label="Enrol — GH₵150" price={150} courseId="d65e71c1-d194-4352-a183-7f8133b9967a" />
              <p className="text-[11px] text-gray mt-3">
                Hiring for a team? <a href="/go/ai-sprint-team" className="font-bold text-blue hover:underline">Get the 5-seat Team Sprint →</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
