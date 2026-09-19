import Link from "next/link";
import { Button } from "@/components/ui";
import { Calendar } from "lucide-react";

export function EventsSection() {
  return (
    <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold tracking-widest uppercase text-amber-strong dark:text-amber mb-3">
          Events
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-8 mb-8">
          <div>
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-navy tracking-tight leading-tight mb-2">
              Something big is coming.
            </h2>
            <p className="text-sm text-gray leading-relaxed">
              Workshops, hackathons, leadership sessions, and community service — all happening right
              here in Klagon. The first dates are being scheduled.
            </p>
          </div>
          <div className="flex items-end justify-end">
            <Link href="/events">
              <Button variant="primary">See Events →</Button>
            </Link>
          </div>
        </div>
        <div className="border border-border rounded-xl p-6 sm:p-8 text-center">
          <Calendar className="mx-auto mb-3 text-amber" size="22" />
          <div className="text-sm font-bold text-navy mb-1">No events scheduled yet.</div>
          <p className="text-sm text-gray leading-relaxed mb-4">
            Members can propose events from their dashboard — every submission is reviewed before
            it goes live. Join free to get notified first.
          </p>
          <Link href="/auth/register">
            <Button variant="primary">Join Free — Get Notified →</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
