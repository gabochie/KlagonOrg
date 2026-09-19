import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata = {
  title: "Terms of Use",
  description: "The terms governing membership and use of KLAGON.org programs and website.",
};

export default function TermsPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Terms of Use
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Simple, fair rules.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Last updated: September 2026. By using klagon.org you agree to these terms.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl border border-border p-6 sm:p-8 flex flex-col gap-5 text-sm text-gray leading-relaxed">
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">Membership</h2>
            <p>
              Registration is free and open to everyone. We may suspend or remove accounts for
              misuse, false information, or behaviour that harms the community.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">Acceptable use</h2>
            <p>
              Be respectful at events and in community spaces. Do not submit spam, false
              information, or content that violates Ghanaian law through any form on this site.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">Donations & sponsorships</h2>
            <p>
              Donations support KLAGON.org programs and are non-refundable except where
              required by law or in the case of a duplicate or erroneous charge — contact us
              within 14 days at <span suppressHydrationWarning className="font-semibold text-navy">hello@klagon.org</span>.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">Tour bookings</h2>
            <p>
              Walk bookings are confirmed by our concierge over WhatsApp before the walk date.
              Reschedule free of charge up to 48 hours before; cancellations within 48 hours
              are non-refundable. If we cancel a walk (weather, safety, minimum party of 4
              not reached), you choose a new date or a full refund via the original MoMo
              channel.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">Content</h2>
            <p>
              Learning materials on this site are for members&apos; personal use. You may not
              republish them commercially without written permission.
            </p>
          </div>
          <div>
            <h2 className="text-base font-bold text-navy mb-1.5">Liability</h2>
            <p>
              Programs and events are provided in good faith. To the extent permitted by law,
              KLAGON.org is not liable for indirect losses arising from use of the site or
              participation in activities. Questions? Email{" "}
              <span suppressHydrationWarning className="font-semibold text-navy">hello@klagon.org</span>.
            </p>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
