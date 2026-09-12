"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { MEMBER_EVENTS } from "@/lib/constants";
import { fetchPublicEvents, fetchMyRsvpIds, toggleRsvp } from "@/lib/queries";
import type { Event } from "@/types";

const typeStyles: Record<string, string> = {
  workshop: "bg-amber/10 text-amber-800",
  hackathon: "bg-green/10 text-green-800",
  leadership: "bg-pale text-blue-800",
  service: "bg-coral/10 text-orange-800",
};

export function UpcomingEvents() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>(MEMBER_EVENTS);
  const [rsvps, setRsvps] = useState<Set<string>>(new Set(["1"]));

  useEffect(() => {
    void (async () => {
      const live = await fetchPublicEvents();
      if (live.length > 0) setEvents(live.slice(0, 3));
      if (profile?.id) {
        const ids = await fetchMyRsvpIds(profile.id);
        setRsvps(new Set(ids));
      }
    })();
  }, [profile?.id]);

  const toggle = async (id: string) => {
    if (!profile) return;
    const going = !rsvps.has(id);
    setRsvps((prev) => {
      const next = new Set(prev);
      if (going) next.add(id);
      else next.delete(id);
      return next;
    });
    await toggleRsvp(profile.id, id, going);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-bold text-navy">Upcoming Events</div>
          <div className="text-[11px] text-gray mt-0.5">
            {rsvps.size} RSVP{rsvps.size === 1 ? "" : "s"} confirmed
          </div>
        </div>
          <Link href="/events" className="text-[11px] font-bold text-blue cursor-pointer hover:underline">
            All Events →
          </Link>
      </div>
      {events.map((e: Event) => {
        const d = new Date(e.date);
        const month = d.toLocaleString("en", { month: "short" });
        const day = d.getDate();
        const isRsvpd = rsvps.has(e.id);
        return (
          <div
            key={e.id}
            className="flex items-start gap-2.5 py-2 border-b border-border last:border-b-0"
          >
            <div className="w-9 h-9 rounded-lg bg-light flex flex-col items-center justify-center flex-shrink-0">
              <div className="text-[8px] font-bold text-gray uppercase">{month}</div>
              <div className="text-sm font-extrabold text-navy leading-none">{day}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-navy truncate">{e.title}</div>
              <div className="text-[10px] text-gray">
                {e.time} · {e.location} · {e.spotsLeft > 0 ? `${e.spotsLeft} spots left` : "Open"}
              </div>
              <span
                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                  typeStyles[e.type]
                }`}
              >
                {e.type}
              </span>
            </div>
            <button
              onClick={() => void toggle(e.id)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer font-sans whitespace-nowrap mt-1 transition-colors ${
                isRsvpd
                  ? "bg-green/10 text-green-800"
                  : "bg-amber text-navy hover:bg-amber/90"
              }`}
            >
              {isRsvpd ? "✓ Going" : "RSVP"}
            </button>
          </div>
        );
      })}
    </div>
  );
}