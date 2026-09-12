"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Badge } from "@/components/ui";
import { EVENTS } from "@/lib/constants";
import { fetchPublicEvents } from "@/lib/queries";
import type { Event } from "@/types";
import { Calendar, MapPin, Clock } from "lucide-react";

const typeBadge: Record<string, "workshop" | "hackathon" | "leadership" | "service"> = {
  workshop: "workshop",
  hackathon: "hackathon",
  leadership: "leadership",
  service: "service",
};

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>(EVENTS);

  useEffect(() => {
    void (async () => {
      const live = await fetchPublicEvents();
      if (live.length > 0) setEvents(live);
    })();
  }, []);

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">Events</div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Show up. Level up. Every week.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Workshops, hackathons, leadership sessions, and community service — all happening right
            here in Klagon. Open to all youth.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e) => {
              const d = new Date(e.date);
              return (
                <div
                  key={e.id}
                  className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-5 sm:p-6">
                    <Badge variant={typeBadge[e.type]} className="mb-3">
                      {e.type}
                    </Badge>
                    <h3 className="text-base font-bold text-navy mb-2">{e.title}</h3>
                    <div className="flex flex-col gap-1.5 mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray">
                        <Calendar size="14" /> {d.toDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray">
                        <Clock size="14" /> {e.time}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray">
                        <MapPin size="14" /> {e.location}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-gray">
                        {e.spots > 0
                          ? `${e.spotsLeft} / ${e.spots} spots left`
                          : "Open registration"}
                      </span>
                      <button className="px-3.5 py-1.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer font-sans hover:bg-blue transition-colors">
                        RSVP
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}