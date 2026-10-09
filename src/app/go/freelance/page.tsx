import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SalesCta } from "@/components/go/SalesCta";

export const metadata: Metadata = {
  title: "Freelance Sprint — Your First Paying Client in 2 Weeks",
  description:
    "A 2-week, phone-only sprint. One offer, a 3-item proof kit, 20 outreaches tracked, half-upfront MoMo invoicing. GH₵100 one-time, verifiable certificate. Built for Klagon youth.",
  alternates: { canonical: "/go/freelance" },
  openGraph: {
    type: "website",
    url: "/go/freelance",
    siteName: "KLAGON.org",
    title: "Freelance Sprint — Your First Paying Client in 2 Weeks",
    description:
      "Phone-only. 2 weeks. Offer + proof kit + 20 outreaches + paid job one. GH₵100 one-time.",
  },
};

const LESSONS = [
  { n: "01", t: "One offer, one buyer", d: "Inventory your skills, pick the buyer who pays fastest near you, write a one-line offer a stranger can repeat. First price buys proof: GH₵50–150." },
  { n: "02", t: "Proof kit on your phone", d: "Before/after, one testimonial, one sample — checkable in 60 seconds. Honest 'no clients yet + sample' beats silence." },
  { n: "03", t: "20 outreaches in 5 days", d: "4-line message, 4 a day, walk-ins + WhatsApp + jobs board. Tracked in a sheet. One polite follow-up, then move on." },
  { n: "04", t: "Invoice on MoMo, deliver job one", d: "Half upfront always, written agreement on WhatsApp, deliver on the date, collect balance + testimonial + referral." },
  { n: "05", t: "Showcase + certificate", d: "One-page freelancer showcase + 2-min intro. Reviewed in 48h. Pass = verifiable certificate + badge." },
];

const FAQS = [
  { q: "I have no skills to sell. Is this for me?", a: "If people already ask you for anything — design, writing, repair, tutoring, errands — you have something to sell. Lesson 1 turns that into one priced offer. If truly zero, start with the free career-prep course at klagon.org/learning first." },
  { q: "No laptop — can I still freelance?", a: "Yes. The whole sprint is phone-only: WhatsApp Business, Google Docs/Sheets, free AI tools. Most local freelance jobs (flyers, catalogues, tutoring, errands) need a phone, not a laptop." },
  { q: "How do I pay?", a: "Mobile Money — MTN, Telecel or AT. GH₵100 one-time, lifetime access. Pay on the course page after free signup; access unlocks the second MoMo confirms." },
  { q: "What do I walk away with?", a: "A priced offer, a proof kit, 20 tracked outreaches, a paid job one (or documented attempts + lessons), and a verifiable certificate (klagon.org/verify, issued within 48h of passing review) + Skills Passport badge." },
  { q: "What if nobody replies?", a: "Then your evidence is 20 tracked outreaches + the lessons write-up — that still passes if the work is real. And most people get replies: 20 targeted local outreaches with a sample almost always converts at least once." },
];

export default function FreelanceSalesPage() {
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
              Your first paying client in 2 weeks — on your phone.
            </h1>
            <p className="text-lg font-bold text-amber mb-3">One offer. 20 outreaches. Half upfront.</p>
            <p className="text-base text-white/65 leading-relaxed max-w-[560px] mb-8">
              Built for Klagon youth with skills but no clients. You leave with{" "}
              <span className="text-white font-bold">a priced offer, proof kit, and paid job one</span>,
              plus a verifiable certificate employers and clients can check.
            </p>
            <SalesCta source="freelance-b2c" secondaryHref="#curriculum" label="Enrol in the sprint" price={100} />
            <p className="text-white/50 text-xs mt-4">
              GH₵100 one-time · MoMo (MTN / Telecel / AT) · Lifetime access · Verifiable certificate within 48h of passing review
            </p>
          </div>
        </section>

        <section id="curriculum" className="bg-white py-14 px-4 sm:px-6 scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-2 text-center">What you build</div>
            <h2 className="text-2xl font-extrabold text-navy text-center tracking-tight mb-2">5 lessons. 20 outreaches. 1 paid job.</h2>
            <p className="text-sm text-gray text-center mb-8">About 20 minutes a lesson + 4 outreaches a day. Evenings-friendly.</p>
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
              <div className="text-sm font-extrabold text-white mb-1">Final showcase: offer + proof + job-one story</div>
              <p className="text-xs text-white/60 mb-4">Reviewed within 48 hours. Pass = verifiable certificate + badge. Fail = feedback + one free retry.</p>
              <SalesCta source="freelance-b2c" secondaryHref="#faq" label="Start Lesson 1 free" />
            </div>
          </div>
        </section>

        <section id="faq" className="bg-light py-14 px-4 sm:px-6 scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-6">Questions, answered honestly</h2>
            <div className="flex flex-col gap-3">
              {FAQS.map((f) => (
                <details key={f.q} className="bg-white rounded-xl border border-border p-4">
                  <summary className="text-sm font-extrabold text-navy cursor-pointer">{f.q}</summary>
                  <p className="text-xs text-gray mt-2 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 text-center">
              <SalesCta source="freelance-b2c" secondaryHref="/learning" label="Enrol — GH₵100" price={100} />
              <p className="text-[11px] text-gray mt-3">
                Thinking bigger? <a href="/go/side-business" className="font-bold text-blue hover:underline">Build a side-business in 90 days →</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
