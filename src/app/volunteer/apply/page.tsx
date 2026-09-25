import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { VolunteerApplyContent } from "./VolunteerApplyContent";

export const metadata: Metadata = {
  title: "Apply to Volunteer",
  description:
    "Apply for a KLAGON.org volunteer role: ID verification, photo and acceptance of the volunteer terms.",
  alternates: { canonical: "/volunteer/apply" },
};

export default function VolunteerApplyPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-10 sm:py-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <Suspense
              fallback={
                <div className="text-white/60 text-sm">Loading application form…</div>
              }
            >
              <VolunteerApplyContent />
            </Suspense>
          </div>
        </section>
        <section className="bg-light py-10 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-xs text-gray leading-relaxed">
            Your ID details are visible to administrators for verification only and are never
            published. Your photo appears on the public Team page once approved. See the{" "}
            <a href="/volunteer/terms" className="font-bold text-blue hover:underline">
              Volunteer Terms & Conditions
            </a>
            .
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
