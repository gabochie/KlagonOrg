import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SalesCta } from "@/components/go/SalesCta";

export const metadata: Metadata = {
  title: "Side-Business Sprint — First Paying Customer in 90 Days",
  description:
    "A 90-day, phone-only sprint for Klagon hustlers. Find a real problem, build a tiny offer, get a stranger to pay. 8 lessons, verifiable certificate. GH₵150 one-time, MoMo, lifetime access.",
  alternates: { canonical: "/go/side-business" },
  openGraph: {
    type: "website",
    url: "/go/side-business",
    siteName: "KLAGON.org",
    title: "Side-Business Sprint — First Paying Customer in 90 Days",
    description:
      "Phone-only. 90 days. Real offer + first stranger payment + verifiable certificate. GH₵150 one-time.",
  },
};

const PHASES = [
  { n: "Find", t: "Days 1–21 · A problem worth paying for", d: "Talk to 20 people, spot money changing hands, pick one painful problem. No building yet." },
  { n: "Build", t: "Days 22–45 · The smallest thing that works", d: "One tiny offer, priced GH₵50–150, deliverable on your phone. Flyer before factory." },
  { n: "Sell", t: "Days 46–70 · 20 conversations, tracked", d: "Walk-ins + WhatsApp outreach like the freelance playbook. Half upfront, always." },
  { n: "Repeat", t: "Days 71–90 · First stranger payment + review", d: "Close, deliver, collect testimonial + referral. Submit your dossier for certificate review." },
];

const FAQS = [
  { q: "I have no capital. Can I still do this?", a: "Yes — the sprint forbids starting with inventory or equipment. Your first offer must be deliverable with your phone + time. Capital comes after customers, not before." },
  { q: "How is this different from the Freelance Sprint?", a: "Freelance sells your time and skill to clients. Side-Business builds a repeatable offer that can grow beyond your hours. Do Freelance first if you need cash in 2 weeks; Side-Business if you want an asset in 90 days." },
  { q: "How do I pay?", a: "Mobile Money — MTN, Telecel or AT. GH₵150 one-time, lifetime access including all future lessons. Pay on the course page after free signup." },
  { q: "What do I walk away with?", a: "A tested offer, a first stranger payment (or a documented 20-conversation attempt with lessons), a business dossier, and a verifiable certificate (klagon.org/verify, issued within 48h of passing review) + Skills Passport badge." },
  { q: "What if nobody pays?", a: "Then you still graduate if you show the work: 20 conversations tracked, offer tested twice, honest lessons written up. Most people discover the paying version of their idea inside those 20 conversations." },
];

export default function SideBusinessSalesPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-amber/8 pointer-events-none" />
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-14 sm:py-20">
            <div className="inline-flex items-center gap-2 bg-amber/15 border border-amber/30 text-amber px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber" />
              Klagon Digital Academy · 90-day sprint · Phone-only
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.12] tracking-tight mb-3 max-w-3xl">
              Your first stranger payment in 90 days — on your phone.
            </h1>
            <p className="text-lg font-bold text-amber mb-3">No capital. No shop. Just a real offer a real person pays for.</p>
            <p className="text-base text-white/65 leading-relaxed max-w-[560px] mb-8">
              Built for Klagon hustlers. Eight lessons across four phases — find, build, sell,
              repeat. You leave with <span className="text-white font-bold">a tested offer and a payment</span>,
              plus a dossier and verifiable certificate to prove it.
            </p>
            <SalesCta source="side-business-b2c" secondaryHref="#phases" label="Start the sprint" price={150} />
            <p className="text-white/50 text-xs mt-4">
              GH₵150 one-time · MoMo (MTN / Telecel / AT) · Lifetime access · Verifiable certificate within 48h of passing review
            </p>
          </div>
        </section>

        <section id="phases" className="bg-white py-14 px-4 sm:px-6 scroll-mt-20">
          <div className="max-w-3xl mx-auto">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-2 text-center">How the 90 days run</div>
            <h2 className="text-2xl font-extrabold text-navy text-center tracking-tight mb-8">4 phases. 8 lessons. 1 payment.</h2>
            <ol className="flex flex-col gap-3">
              {PHASES.map((p) => (
                <li key={p.n} className="flex gap-4 bg-light rounded-xl border border-border p-4">
                  <span className="text-xs font-extrabold text-amber-strong bg-amber/10 rounded-lg px-2.5 py-1 h-fit">{p.n}</span>
                  <span>
                    <span className="block text-sm font-extrabold text-navy">{p.t}</span>
                    <span className="block text-xs text-gray mt-1 leading-relaxed">{p.d}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="mt-6 rounded-xl bg-navy p-5 text-center">
              <div className="text-sm font-extrabold text-white mb-1">Final dossier: offer + payment proof + lessons</div>
              <p className="text-xs text-white/60 mb-4">Reviewed within 48 hours. Pass = verifiable certificate + badge. Fail = feedback + one free retry.</p>
              <SalesCta source="side-business-b2c" secondaryHref="#faq" label="Start Phase 1 free" />
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
              <SalesCta source="side-business-b2c" secondaryHref="/learning" label="Enrol — GH₵150" price={150} />
              <p className="text-[11px] text-gray mt-3">
                Need cash faster? <a href="/go/freelance" className="font-bold text-blue hover:underline">Get your first client in 2 weeks →</a>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
