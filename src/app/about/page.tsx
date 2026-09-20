import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "About KLAGON.org",
  description:
    "KLAGON.org is the digital home of Klagon — where the community learns, hosts, maps itself, and does business.",
  alternates: { canonical: "/about" },
};

const DOORS = [
  {
    icon: "🧭",
    title: "Visit",
    text: "Guesthouses and short-stays with real photos and honest prices, the food the community actually eats, and the lagoon, markets, and events worth your trip — booked over WhatsApp.",
    href: "/visit",
    cta: "Plan your stay →",
  },
  {
    icon: "🎓",
    title: "Learn",
    text: "AI and tech skills, entrepreneurship, leadership, and finance — structured tracks, mentorship, and real projects. No laptop required to start, free for members.",
    href: "/learning",
    cta: "Start learning →",
  },
  {
    icon: "🗺️",
    title: "See",
    text: "A living map of Klagon — projects, events, businesses, schools, health points, and places to stay, plotted together so everyone can see the community at a glance.",
    href: "/map",
    cta: "Explore the map →",
  },
  {
    icon: "🏪",
    title: "Trade",
    text: "Classifieds and verified partner storefronts for local businesses — your profile, digital card, and badge in one tap. No website needed to look professional.",
    href: "/classifieds",
    cta: "Browse classifieds →",
  },
];

const VALUES = [
  {
    title: "Skills over certificates",
    text: "Practical, usable skills — AI and tech, financial literacy, leadership, entrepreneurship — that young people can apply immediately.",
  },
  {
    title: "Community-driven",
    text: "Built by and for Klagon. Mentors, volunteers, and members all give back to grow the community together.",
  },
  {
    title: "Free at the point of use",
    text: "Learning here shouldn't need a laptop or a bank account. Every course and event is free for members.",
  },
  {
    title: "Honest about pilot stage",
    text: "We are live and we are still building. What's working is marked live; what's coming is marked soon — see below. We would rather under-promise than over-claim.",
  },
];

const FLYWHEEL = [
  { n: "1", title: "Visit — stay, eat, see", text: "Visitors sleep in community-listed stays." },
  { n: "2", title: "Learn — skills and mentorship", text: "Stays fund the youth programs on the same streets." },
  { n: "3", title: "Map — the community, visualised", text: "Youth map the businesses, schools, and projects." },
  { n: "4", title: "Trade — business that hires back", text: "Businesses hire the trained talent." },
];

export default function AboutPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              About KLAGON.org
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              One platform. Four doors into Klagon.
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
              KLAGON.org is the digital home of Klagon — a community platform where residents,
              businesses, visitors and young people discover what&apos;s happening, learn new
              skills, trade locally, and help build the community. Free to join.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/auth/register">
                <Button variant="primary">Join Free Today →</Button>
              </Link>
              <Link href="/visit">
                <Button variant="dark">Visit Klagon →</Button>
              </Link>
            </div>
            <p className="text-white/40 text-[11px] mt-4">
              Klagon · Tema West · Ghana — A Gabochie Design community initiative, currently in
              pilot
            </p>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight mb-2">
              Four doors, one street.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {DOORS.map((d) => (
                <div key={d.title} className="bg-pale rounded-xl p-5 sm:p-6 border border-border">
                  <div className="text-2xl mb-2">{d.icon}</div>
                  <h3 className="text-sm font-extrabold text-navy mb-1.5">{d.title}</h3>
                  <p className="text-xs text-gray leading-relaxed mb-3">{d.text}</p>
                  <Link href={d.href} className="text-xs font-bold text-navy underline">
                    {d.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight mb-2">
              How it connects
            </h2>
            <p className="text-sm font-bold text-navy mb-6">The money stays on the street.</p>
            <p className="text-sm text-gray leading-relaxed mb-6 max-w-2xl">
              Visitors sleep in community-listed stays. Stays fund the youth programs on the same
              streets. Youth map the businesses, schools, and projects. Businesses hire the
              trained talent. One flywheel, four doors.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {FLYWHEEL.map((f) => (
                <div key={f.n} className="bg-white rounded-xl border border-border p-5">
                  <div className="w-8 h-8 rounded-full bg-navy text-white text-sm font-extrabold flex items-center justify-center mb-2">
                    {f.n}
                  </div>
                  <div className="text-xs font-bold text-navy mb-1">{f.title}</div>
                  <div className="text-[11px] text-gray leading-snug">{f.text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight mb-6">
              What we stand for
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {VALUES.map((v) => (
                <div key={v.title} className="bg-pale rounded-xl p-5 sm:p-6 border border-border">
                  <h3 className="text-sm font-bold text-navy mb-2">{v.title}</h3>
                  <p className="text-xs text-gray leading-relaxed">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight mb-4">
              Live now, coming soon.
            </h2>
            <div className="bg-white rounded-xl border border-border p-5 sm:p-6 mb-4">
              <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-2">
                Live now
              </div>
              <p className="text-sm text-gray leading-relaxed">
                Learning tracks, community projects, the layered map, stays booking over
                WhatsApp, classifieds (properties, vehicles), mentor and volunteer onboarding.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-border p-5 sm:p-6 mb-6">
              <div className="text-xs font-bold tracking-widest uppercase text-gray mb-2">
                Coming soon
              </div>
              <p className="text-sm text-gray leading-relaxed">
                Food listings, local guides, and the community events calendar. Join free and we
                will notify you first.
              </p>
            </div>
            <Link href="/auth/register">
              <Button variant="primary">Join Free — Get Notified →</Button>
            </Link>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy tracking-tight mb-4">
              Who runs it.
            </h2>
            <p className="text-sm text-gray leading-relaxed max-w-2xl mb-4">
              KLAGON.org is a Gabochie Design community initiative, currently in pilot — P.O. Box
              SK 2125, Sakumono, Tema, Ghana. Day to day it runs on mentors, volunteers, and
              members from Klagon itself.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-bold">
              <Link href="/contact" className="text-navy underline">
                Contact Us
              </Link>
              <a
                href="https://wa.me/233268708895"
                target="_blank"
                rel="noopener noreferrer"
                className="text-navy underline"
              >
                WhatsApp
              </a>
              <a href="tel:+233243262019" className="text-navy underline">
                Call +233 24 326 2019
              </a>
            </div>
          </div>
        </section>

        <section className="bg-navy py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
              Help Klagon&apos;s youth get the future they deserve.
            </h2>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
              Whether you&apos;re a company, diaspora member, NGO, or individual — your support
              funds workshops, equipment, mentors, and the next generation of Ghanaian
              innovators.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/sponsor">
                <Button variant="primary">Become a Sponsor →</Button>
              </Link>
              <Link href="/donate">
                <Button variant="dark">Make a Donation →</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
