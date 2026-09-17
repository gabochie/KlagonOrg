import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Privacy Policy",
  description: "How KlagonOrg collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Privacy Policy
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Your data, respected.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Last updated: September 2026. Here is what we collect and why.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-border p-6 sm:p-8 flex flex-col gap-5 text-sm text-gray leading-relaxed">
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">What we collect</h2>
            <p>
              When you register or use our forms, we collect your name, contact details, age,
              occupation, interests, and career goal. Donations additionally record the amount
              and payment reference so we can confirm your gift.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">How we use it</h2>
            <p>
              We use your information to run membership (event RSVPs, learning
              progress, volunteer roles), communicate about programs, and report impact to
              sponsors. We never sell your personal data.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">Who can see it</h2>
            <p>
              Your profile is visible to KlagonOrg admins for program management.
              Aggregated, anonymous statistics may be shared with partners. Payment details
              are processed by our payment provider; we never store card or mobile-money PINs.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">Your rights</h2>
            <p>
              Under Ghana&apos;s Data Protection Act, 2012 (Act 843), you may request access,
              correction, or deletion of your data at any time by emailing{" "}
              <span suppressHydrationWarning className="font-semibold text-navy">hello@klagon.org</span>.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">Children</h2>
            <p>
              Members under 18 should register with a parent or guardian&apos;s consent.
            </p>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
