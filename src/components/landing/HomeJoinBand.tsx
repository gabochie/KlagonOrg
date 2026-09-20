import Link from "next/link";
import { Button } from "@/components/ui";

export function HomeJoinBand() {
  return (
    <section className="bg-navy py-12 sm:py-14 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="text-center sm:text-left">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-1.5">
            Join free
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Learn, trade, and help build Klagon.
          </h2>
          <p className="text-sm text-white/60 mt-1">
            One account for courses, the map, the directory, jobs and local opportunities.
          </p>
        </div>
        <Link href="/auth/register" className="shrink-0">
          <Button size="lg">Join Free Today →</Button>
        </Link>
      </div>
    </section>
  );
}