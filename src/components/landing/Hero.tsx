import Link from "next/link";
import { Button } from "@/components/ui";

export function Hero() {
  return (
    <section className="bg-navy relative overflow-hidden min-h-[520px] flex items-center">
      <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-amber/8 pointer-events-none" />
      <div className="absolute -bottom-30 left-[40%] w-[300px] h-[300px] rounded-full bg-green/6 pointer-events-none" />
      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-20">
        <div className="inline-flex items-center gap-2 bg-amber/15 border border-amber/30 text-amber px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber" />
          Klagon, Greater Accra — Open to All Youth
        </div>
        <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-extrabold text-white leading-[1.15] tracking-tight max-w-[580px] mb-5">
          Preparing Klagon&apos;s Youth for <span className="text-amber">The Future</span>.
        </h1>
        <p className="text-base text-white/65 leading-relaxed max-w-[480px] mb-8">
          Your community. Your skills. Your opportunity. Klagon Studios is where Klagon&apos;s next generation
          discovers tech, entrepreneurship, leadership — and builds real things that matter.
        </p>
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <Link href="/auth/register">
            <Button size="lg">Join Free Today →</Button>
          </Link>
          <Link href="/events">
            <Button variant="ghost" size="lg">Explore Events</Button>
          </Link>
        </div>
        <div className="flex gap-8 sm:gap-10 pt-6 border-t border-white/10 flex-wrap">
          {[
            { num: "100+", label: "Target Members" },
            { num: "6", label: "Learning Tracks" },
            { num: "5+", label: "Community Projects" },
            { num: "Free", label: "To Join" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-extrabold text-white">
                {s.num}
              </div>
              <div className="text-xs text-white/50 font-medium mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
