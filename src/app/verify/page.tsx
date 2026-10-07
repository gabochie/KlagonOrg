import type { Metadata } from "next";
import { Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { VerifyContent } from "@/components/verify/VerifyContent";

export const metadata: Metadata = {
  title: "Verify a Certificate",
  description:
    "Check a KLAGON.org course certificate by its code. Every certificate carries a verifiable ID issued after project review.",
  alternates: { canonical: "/verify" },
};

export default function VerifyPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <Suspense
        fallback={
          <main className="w-full">
            <section className="bg-light py-20 px-4 text-center text-sm text-gray">Loading…</section>
          </main>
        }
      >
        <VerifyContent />
      </Suspense>
      <Footer />
    </div>
  );
}
