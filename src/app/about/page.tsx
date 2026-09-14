import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "About KlagonOrg",
  description:
    "KlagonOrg is a youth community in Klagon, Ghana building skills for the future — through learning tracks, mentorship, community projects, and events.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    title: "Skills over certificates",
    text: "We focus on practical, usable skills — AI & tech, financial literacy, leadership, entrepreneurship — that young people can apply immediately.",
  },
  {
    title: "Community-driven",
    text: "Built by and for Klagon's youth. Mentors, volunteers, and members all give back to grow the community together.",
  },
  {
    title: "Free at the point of use",
    text: "Learning here shouldn't need a laptop or a bank account. Every course and event is free for members.",
  },
];

export default function AboutPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            About KlagonOrg
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Preparing Klagon&apos;s youth for the future.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            We&apos;re a youth community in Klagon, Ghana — building skills, connections, and
            opportunity through structured learning tracks, mentorship, and real community
            projects.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight mb-6">
            What we stand for
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-xl border border-border p-6">
                <h3 className="text-sm font-bold text-navy mb-2">{v.title}</h3>
                <p className="text-xs text-gray leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 bg-navy rounded-xl p-6 sm:p-8 text-center">
            <h2 className="text-lg font-extrabold text-white mb-2">Join the community</h2>
            <p className="text-white/60 text-xs max-w-md mx-auto mb-5">
              Register for free to start a learning track, earn XP, and take part in projects and
              events in Klagon.
            </p>
            <a
              href="/auth/register"
              className="inline-block px-6 py-2.5 rounded-lg bg-amber text-navy text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Join KlagonOrg
            </a>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}