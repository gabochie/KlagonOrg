import Link from "next/link";
import { Button } from "@/components/ui";

export function Hero() {
  return (
    <section className="bg-navy relative overflow-hidden min-h-[520px] flex items-center">
      <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-amber/8 pointer-events-none" />
      <div className="absolute -bottom-30 left-[40%] w-[300px] h-[300px] rounded-full bg-green/6 pointer-events-none" />
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid md:grid-cols-[1fr_auto] gap-10 md:gap-8 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber/15 border border-amber/30 text-amber px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber" />
              Klagon, Greater Accra · The Digital Home of Klagon
            </div>
            <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.15] tracking-tight max-w-[580px] mb-5">
              The digital home of <span className="text-amber">Klagon</span>.
            </h1>
            <p className="text-base text-white/65 leading-relaxed max-w-[480px] mb-8">
              Discover what&apos;s happening. Find local businesses, jobs and places to stay.
              Learn new skills, map the community, and help build it — for residents,
              businesses, visitors and young people alike.
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-10">
              <Link href="/auth/register">
                <Button size="lg">Join Free Today →</Button>
              </Link>
              <Link href="/map">
                <Button variant="ghost" size="lg">Explore Klagon →</Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block md:justify-self-end">
            <img
              src="/brand/youth-hero.png"
              alt="Klagon community learning and building together"
              className="w-[440px] h-auto rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/40 object-cover"
              loading="eager"
            />
          </div>
        </div>
        <div className="flex gap-8 sm:gap-10 pt-6 border-t border-white/10 flex-wrap mt-10">
          {[
            "Residents",
            "Businesses",
            "Young people",
            "Visitors",
            "Organizations",
          ].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber" />
              <div className="text-xs text-white/60 font-medium">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
