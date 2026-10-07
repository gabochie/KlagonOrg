import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SalesCta } from "@/components/go/SalesCta";

export const metadata: Metadata = {
  title: "Hire KLAGON-Trained Youth — Trial Before You Commit",
  description:
    "From Team Sprint to talent pipeline: meet graduates with proven automation blueprints, try them on a 2-week paid trial, hire with confidence. Talent Partner GH₵5,000/mo. Verified + concierge.",
  alternates: { canonical: "/go/hire" },
};

export default function HirePage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-amber/8 pointer-events-none" />
          <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-14 sm:py-20">
            <div className="inline-flex items-center gap-2 bg-amber/15 border border-amber/30 text-amber px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber" />
              For employers · Proof before payroll
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.12] tracking-tight mb-3 max-w-3xl">
              Hire youth whose work you&apos;ve already seen.
            </h1>
            <p className="text-lg font-bold text-amber mb-3">Blueprint first. Interview second. Payroll last.</p>
            <p className="text-base text-white/65 leading-relaxed max-w-[560px] mb-8">
              Every KLAGON graduate ships a reviewed project — automation blueprint, business
              plan, or portfolio piece with a verifiable ID. Browse proof, run a{" "}
              <span className="text-white font-bold">2-week paid trial</span>, then hire.
              No CV lottery.
            </p>
            <SalesCta source="go-hire" secondaryHref="#how" label="Meet 3 candidates" />
            <p className="text-white/50 text-xs mt-4">
              Free to browse · Trial at your normal junior rate · Talent Partner GH₵5,000/mo for ongoing pipeline
            </p>
          </div>
        </section>

        <section id="how" className="bg-light py-12 px-4 sm:px-6 scroll-mt-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-2">How hiring works</h2>
            <p className="text-sm text-gray text-center mb-8 max-w-lg mx-auto">
              Three steps. You see real work before you spend real money.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { e: "📁", t: "1. See proof", d: "We send 3 candidate profiles with verified blueprints + demo videos. Check any certificate at /verify." },
                { e: "🧪", t: "2. Paid trial", d: "2 weeks on a real task at your junior rate. We mentor them; you judge output, not interviews." },
                { e: "🤝", t: "3. Hire or pass", d: "Hire direct — no placement fee on trial conversions. Or join Talent Partner for a steady pipeline." },
              ].map((c) => (
                <div key={c.t} className="bg-white rounded-2xl border border-border p-5">
                  <div className="text-2xl mb-2">{c.e}</div>
                  <h3 className="text-sm font-extrabold text-navy mb-1">{c.t}</h3>
                  <p className="text-xs text-gray leading-relaxed">{c.d}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 max-w-2xl mx-auto bg-navy rounded-2xl p-6 text-center">
              <div className="text-sm font-extrabold text-white mb-1">Already training your staff?</div>
              <p className="text-xs text-white/60 mb-4">Team Sprint graduates make the strongest first hires — you watched them work.</p>
              <div className="flex justify-center">
                <SalesCta source="go-hire" secondaryHref="/go/ai-sprint-team" label="Start with a Team Sprint" price={2000} />
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
