import Link from "next/link";
import { Button, Badge } from "@/components/ui";
import { EVENTS } from "@/lib/constants";
import { Calendar } from "lucide-react";

const typeBadge: Record<string, "workshop" | "hackathon" | "leadership" | "service"> = {
  workshop: "workshop",
  hackathon: "hackathon",
  leadership: "leadership",
  service: "service",
};

export function EventsSection() {
  return (
    <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
          Upcoming Events
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr] gap-8 mb-8">
          <div>
            <h2 className="text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-navy tracking-tight leading-tight mb-2">
              Show up. Level up. Every week.
            </h2>
            <p className="text-sm text-gray leading-relaxed">
              Workshops, hackathons, leadership sessions, and community service — all happening right
              here in Klagon.
            </p>
          </div>
          <div className="flex items-end justify-end">
            <Link href="/events">
            <Button variant="primary">See All Events →</Button>
          </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EVENTS.map((e) => (
            <div key={e.id} className="border border-border rounded-xl overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-pale">
                <Badge variant={typeBadge[e.type]} className="mb-2">
                  {e.type}
                </Badge>
                <div className="text-sm font-bold text-navy mb-1">{e.title}</div>
                <div className="flex items-center gap-1.5 text-xs text-gray">
                  <Calendar size="12" /> {e.date} · {e.time}
                </div>
              </div>
              <div className="px-4 sm:px-5 py-3 flex items-center justify-between">
                <span className="text-xs text-gray">
                  {e.spots > 0 ? `${e.spotsLeft} / ${e.spots} spots left` : "All welcome"}
                </span>
                <Button size="sm">RSVP</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
