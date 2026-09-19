import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui";

export default function VisitPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Klagon · Tema West · Ghana
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              Visit Klagon
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
              Verified guesthouses and short-stays, local food, and things worth your trip —
              reviewed by visitors and our team, booked over WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/visit/stays">
                <Button variant="primary">Find a Place to Stay →</Button>
              </Link>
              <Link href="/map">
                <Button variant="dark">Explore the Map →</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border border-border rounded-2xl p-6">
              <div className="text-2xl mb-2">🛏️</div>
              <div className="text-sm font-extrabold text-navy mb-1">Stay</div>
              <p className="text-xs text-gray leading-relaxed mb-3">
                Guesthouses and short-stays with real photos, honest prices, and visitor reviews.
              </p>
              <Link href="/visit/stays" className="text-xs font-bold text-navy underline">
                Browse stays →
              </Link>
            </div>
            <div className="border border-border rounded-2xl p-6">
              <div className="text-2xl mb-2">🍲</div>
              <div className="text-sm font-extrabold text-navy mb-1">Eat</div>
              <p className="text-xs text-gray leading-relaxed mb-3">
                Chop bars and kitchens the community actually eats at. Food listings open soon.
              </p>
              <Link href="/classifieds" className="text-xs font-bold text-navy underline">
                Browse marketplace →
              </Link>
            </div>
            <div className="border border-border rounded-2xl p-6">
              <div className="text-2xl mb-2">🌊</div>
              <div className="text-sm font-extrabold text-navy mb-1">See & Do</div>
              <p className="text-xs text-gray leading-relaxed mb-3">
                Beach road, lagoon, markets, and community events. Guides land with the next
                update.
              </p>
              <Link href="/events" className="text-xs font-bold text-navy underline">
                See events →
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-pale py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-3">
              Diaspora & Homecoming
            </div>
            <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-extrabold text-navy tracking-tight mb-2">
              Coming home? Stay with people who know your name.
            </h2>
            <p className="text-sm text-gray leading-relaxed mb-5">
              Every stay supports the community that hosts you — KLAGON.org&apos;s youth programs
              run on the same streets you&apos;ll sleep on.{" "}
              <Link href="/about" className="font-bold text-navy underline">
                Our youth mission →
              </Link>
            </p>
            <Link href="/visit/stays">
              <Button variant="primary">Plan Your Stay →</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
