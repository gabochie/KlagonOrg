import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { VOLUNTEER_TERMS_VERSION } from "@/lib/volunteers";

export const metadata: Metadata = {
  title: "Volunteer Terms & Conditions",
  description:
    "The terms every KLAGON.org volunteer accepts: unpaid service, 30-day probation, performance review and ID verification.",
  alternates: { canonical: "/volunteer/terms" },
};

const sections: Array<{ heading: string; body: string[] }> = [
  {
    heading: "1. Unpaid service",
    body: [
      "All KLAGON.org volunteer roles are currently unpaid. We will not pay stipends, salaries or allowances until further notice, and no promise of future pay is made by accepting these terms.",
      "Any future change to compensation will be announced openly and will apply from the announced date — never retroactively.",
    ],
  },
  {
    heading: "2. Thirty-day probation",
    body: [
      "Every approved volunteer starts on a 30-day probation from the date of approval.",
      "Whether your engagement continues after probation depends entirely on your performance during those 30 days: reliability, quality of work, hours given and conduct.",
      "At the end of probation your role is either confirmed, extended once with feedback, or ended. You will be notified in your account in all cases.",
    ],
  },
  {
    heading: "3. Performance expectations",
    body: [
      "Volunteers are expected to complete assigned tasks, log their hours honestly, attend agreed shifts or communicate early when unavailable, and accept feedback from coordinators.",
      "Repeated missed commitments without communication, dishonest hour logs, or poor-quality work are grounds for ending the engagement — during or after probation.",
    ],
  },
  {
    heading: "4. Identity verification",
    body: [
      "To protect the community you will serve, every volunteer must provide a valid Ghana Card (type and number) plus a clear photo of themselves at signup.",
      "Your ID details are visible only to administrators for verification. They are never shown publicly. Your photo may appear on the public Team page once your application is approved.",
    ],
  },
  {
    heading: "5. Conduct",
    body: [
      "Volunteers represent KLAGON.org in Klagon and online. Treat community members, fellow volunteers and partners with respect. Do not use your role for personal business advantage, and report conflicts of interest to a coordinator.",
      "Misconduct — including harassment, fraud, theft or bringing the organisation into disrepute — ends the engagement immediately.",
    ],
  },
  {
    heading: "6. Data and photos",
    body: [
      "We store your application details, ID information, photo, hours and performance records to run the volunteer programme. ID numbers are never published.",
      "Photos and activity from volunteer work may be used in KLAGON.org stories and reports. Tell a coordinator in writing if you want a specific photo removed and we will act within 48 hours.",
    ],
  },
  {
    heading: "7. Ending the engagement",
    body: [
      "You may step down at any time by informing your coordinator — no penalties, and you remain welcome in the community.",
      "KLAGON.org may end an engagement at any time, with reasons communicated to you. Probation decisions are final but do not affect your membership or access to learning.",
    ],
  },
];

export default function VolunteerTermsPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-[10px] font-bold tracking-widest uppercase text-amber-strong mb-2">
            Volunteer · Terms & Conditions · v{VOLUNTEER_TERMS_VERSION}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy tracking-tight mb-3">
            Volunteer Terms & Conditions
          </h1>
          <p className="text-sm text-gray leading-relaxed mb-8">
            Please read carefully before applying. Checking the acceptance box on the application
            form records that you agree to this version of the terms.
          </p>
          <div className="space-y-6">
            {sections.map((s) => (
              <section key={s.heading} className="bg-white rounded-xl border border-border p-5 sm:p-6">
                <h2 className="text-sm font-extrabold text-navy mb-2">{s.heading}</h2>
                {s.body.map((p, i) => (
                  <p key={i} className="text-sm text-gray leading-relaxed mb-2 last:mb-0">
                    {p}
                  </p>
                ))}
              </section>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/volunteer"
              className="inline-flex items-center rounded-lg bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-blue transition-colors"
            >
              Browse volunteer roles →
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2.5 text-xs font-bold text-navy hover:border-navy transition-colors"
            >
              Questions? Contact us
            </Link>
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
