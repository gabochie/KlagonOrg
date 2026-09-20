import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { JobsBoard } from "@/components/posts/JobsBoard";
import { JobsHeroCarousel } from "@/components/sections/JobsHeroCarousel";

export const metadata: Metadata = {
  title: "Jobs & Opportunities — Klagon, Lashibi & Tema | KLAGON.org",
  description:
    "Find jobs, gigs, apprenticeships, internships and volunteer roles in Klagon and Tema West. Free to post; listings are reviewed and expire automatically so the board stays fresh.",
  alternates: { canonical: "/jobs" },
};

export default function JobsPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-amber/8 pointer-events-none" />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(300px,440px)] gap-10 md:gap-12 items-center">
            <div>
              <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
                Klagon Jobs &amp; Opportunities
              </div>
              <h1 className="text-[clamp(1.9rem,4vw,2.9rem)] font-extrabold text-white tracking-tight leading-tight mb-3 max-w-2xl">
                Fresh openings, close to home.
              </h1>
              <p className="text-white/60 text-sm max-w-lg mb-8">
                Jobs, gigs, apprenticeships, internships and volunteer roles across Klagon, Lashibi and
                Tema West. Every listing is reviewed before it goes live and expires automatically after
                30 days, so nothing here goes stale.
              </p>
              <Link
                href="/submit"
                className="inline-flex items-center gap-2 rounded-xl bg-amber text-navy px-5 py-3 text-sm font-bold hover:bg-amber-strong hover:text-white transition-colors cursor-pointer font-sans"
              >
                <Briefcase size="16" /> Post a job — free
              </Link>
            </div>
            <div className="w-full max-w-[440px] mx-auto md:mx-0">
              <JobsHeroCarousel />
            </div>
          </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <JobsBoard />
        </section>
      </main>
      <Footer />
    </div>
  );
}