"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchPublicEvents, fetchMyRsvpIds, toggleRsvp, isUuid } from "@/lib/queries";
import { EventSubmitForm } from "@/components/events/EventSubmitForm";
import type { Event } from "@/types";
import { Calendar, Clock, MapPin, Sparkles, ShieldCheck } from "lucide-react";

const typeBadge: Record<string, "workshop" | "hackathon" | "leadership" | "service"> = {
  workshop: "workshop",
  hackathon: "hackathon",
  leadership: "leadership",
  service: "service",
};

export function EventsSection() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [ready, setReady] = useState(false);
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    void (async () => {
      const live = await fetchPublicEvents();
      setEvents(live);
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    void fetchMyRsvpIds(profile.id).then((ids) => setRsvps(new Set(ids)));
  }, [profile?.id]);

  const toggle = async (id: string) => {
    if (!profile) {
      setNotice("Sign in to RSVP for events.");
      return;
    }
    if (!isUuid(id)) return;
    const going = !rsvps.has(id);
    setRsvps((prev) => {
      const next = new Set(prev);
      if (going) next.add(id);
      else next.delete(id);
      return next;
    });
    await toggleRsvp(profile.id, id, going);
    const ids = await fetchMyRsvpIds(profile.id);
    setRsvps(new Set(ids));
    setNotice(null);
  };

  return (
    <main className="w-full">
      <section className="bg-navy relative overflow-hidden py-16 sm:py-20 px-4 sm:px-6">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-amber/8 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            {events.length > 0 ? "Klagon Events" : "Klagon Events · Coming Soon"}
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            {events.length > 0 ? "Show up. Level up. Every week." : "Something big is coming."}
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            {events.length > 0
              ? "Workshops, hackathons, leadership sessions, and community service — open to all youth in Klagon."
              : "We are lining up our first sessions. Until then, any registered member can propose an event — an admin approves it before it goes live here."}
          </p>
        </div>
      </section>

      <section className="bg-light py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {notice && (
            <div className="mb-6 text-xs font-semibold bg-amber/10 text-navy rounded-lg px-4 py-3">
              {notice}{" "}
              <Link href="/auth/login" className="font-bold text-blue hover:underline">
                Sign in →
              </Link>
            </div>
          )}

          {!ready ? (
            <div className="py-16 text-center">
              <div className="animate-pulse text-xs text-gray font-semibold">Loading events…</div>
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border p-10 sm:p-14 text-center max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-pale flex items-center justify-center mx-auto mb-5">
                <Sparkles size="22" className="text-amber" />
              </div>
              <h2 className="text-xl font-extrabold text-navy tracking-tight mb-2">
                No events scheduled yet
              </h2>
              <p className="text-sm text-gray leading-relaxed mb-2">
                The first workshops, hackathons and community sessions are being lined up. Got an idea
                worth gathering the community for? Propose it — it&apos;ll be reviewed and published if approved.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber text-navy text-sm font-extrabold hover:bg-amber-strong hover:text-white transition-colors cursor-pointer font-sans"
              >
                Propose an event →
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="text-lg font-extrabold text-navy tracking-tight">Upcoming</h2>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-blue transition-colors cursor-pointer font-sans"
                >
                  Propose an event
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((e) => {
                  const d = new Date(e.date);
                  const isRsvpd = rsvps.has(e.id);
                  return (
                    <div
                      key={e.id}
                      className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-5 sm:p-6">
                        <Badge variant={typeBadge[e.type]} className="mb-3">
                          {e.type}
                        </Badge>
                        <h2 className="text-base font-bold text-navy mb-2">{e.title}</h2>
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
                          <button
                            onClick={() => void toggle(e.id)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer font-sans transition-colors ${
                              isRsvpd ? "bg-green/10 text-green-800" : "bg-navy text-white hover:bg-blue"
                            }`}
                          >
                            {isRsvpd ? "✓ Going" : "RSVP"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-12 max-w-3xl mx-auto">
            <div className="grid grid-cols-[auto_1fr] gap-5 sm:gap-8 items-start">
              <div className="hidden sm:block text-center pt-1">
                <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-4">
                  How it works
                </div>
                <div className="space-y-6">
                  {[
                    { icon: "✍️", label: "1 · Propose an event" },
                    { icon: "🛂", label: "2 · Admin reviews" },
                    { icon: "📅", label: "3 · Goes live" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center gap-1.5">
                      <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-base">
                        {s.icon}
                      </div>
                      <div className="text-[10px] font-bold text-gray max-w-[90px] leading-tight">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
                <div className="mb-5">
                  <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-amber-strong">
                    <ShieldCheck size="14" /> Propose an event
                  </div>
                  <h2 className="text-lg font-extrabold text-navy tracking-tight mt-1">
                    Run something in Klagon
                  </h2>
                  <p className="text-sm text-gray mt-1">
                    Any registered member can propose a workshop, hackathon, session or service drive.
                    A moderator approves it before it is published — no spam, no surprises.
                  </p>
                </div>
                {!profile ? (
                  <div className="rounded-xl bg-light border border-border p-5 text-center">
                    <p className="text-sm font-bold text-navy mb-1">Ready to run something?</p>
                    <p className="text-xs text-gray mb-4">
                      Join free as a Klagon member, then propose your event in under a minute.
                    </p>
                    <div className="flex items-center justify-center gap-2.5">
                      <Link
                        href="/auth/register"
                        className="px-5 py-2.5 rounded-lg bg-navy text-white text-xs font-bold hover:bg-blue transition-colors font-sans"
                      >
                        Create free account
                      </Link>
                      <Link
                        href="/auth/login"
                        className="px-5 py-2.5 rounded-lg border border-border text-navy text-xs font-bold hover:bg-light transition-colors font-sans"
                      >
                        Sign in
                      </Link>
                    </div>
                  </div>
                ) : showForm ? (
                  <EventSubmitForm />
                ) : (
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber text-navy text-sm font-extrabold hover:bg-amber-strong hover:text-white transition-colors cursor-pointer font-sans"
                  >
                    Start a proposal
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}