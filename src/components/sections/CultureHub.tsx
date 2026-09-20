"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import { fetchCultureEvents } from "@/lib/events";
import { fetchCulturePosts, fetchCultureCreators } from "@/lib/posts";
import type { CultureCreator } from "@/lib/posts";
import { fetchMyRsvpIds, toggleRsvp, isUuid } from "@/lib/queries";
import type { Event, Post } from "@/types";
import { Sparkles, Calendar, Clock, MapPin, Music2, Landmark, BookOpen, PenLine } from "lucide-react";

const typeBadge: Record<string, "workshop" | "hackathon" | "leadership" | "service"> = {
  workshop: "workshop",
  hackathon: "hackathon",
  leadership: "leadership",
  service: "service",
};

const places = [
  {
    icon: Landmark,
    title: "Heritage on the map",
    body: "Cultural venues, landmarks and gathering spots across Klagon — plotted and searchable.",
    href: "/map",
    cta: "Explore the map",
  },
  {
    icon: BookOpen,
    title: "Heritage & community walks",
    body: "The Homowo Edition, Klagon by Night and more — guided walks narrated by the community.",
    href: "/visit/walk",
    cta: "See the walks",
  },
  {
    icon: Music2,
    title: "Culture in the news",
    body: "Ongoing stories and features from Chieftaincy & Culture and Arts & Music.",
    href: "/news",
    cta: "Read the news",
  },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function CultureHub() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [creators, setCreators] = useState<CultureCreator[]>([]);
  const [rsvps, setRsvps] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const [ev, ps, cr] = await Promise.all([
        fetchCultureEvents(),
        fetchCulturePosts(6),
        fetchCultureCreators(),
      ]);
      setEvents(ev);
      setPosts(ps);
      setCreators(cr);
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

  const featuredEvent = events[0];
  const featuredPost = posts[0];
  const hasContent = events.length > 0 || posts.length > 0 || creators.length > 0;

  return (
    <main className="w-full">
      <section className="bg-navy relative overflow-hidden py-16 sm:py-20 px-4 sm:px-6">
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full bg-amber/8 pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-[380px] h-[380px] rounded-full bg-blue/10 pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-amber mb-3 ring-1 ring-amber/25 rounded-full px-3 py-1">
            <Sparkles size="13" /> Arts &amp; Culture
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            The sounds, stages and stories of Klagon.
          </h1>
          <p className="text-white/60 text-sm max-w-2xl mx-auto">
            Festivals, performances, music and heritage — one home on klagon.org. Follow what&apos;s on,
            read the stories behind it, and put your own event or feature on the calendar.
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
              <div className="animate-pulse text-xs text-gray font-semibold">Loading Arts &amp; Culture…</div>
            </div>
          ) : !hasContent ? (
            <div className="bg-white rounded-2xl border border-border p-10 sm:p-14 text-center max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-pale flex items-center justify-center mx-auto mb-5">
                <Sparkles size="22" className="text-amber" />
              </div>
              <h2 className="text-xl font-extrabold text-navy tracking-tight mb-2">
                The stage is being set
              </h2>
              <p className="text-sm text-gray leading-relaxed mb-2">
                Cultural events and stories are being lined up. Got a festival, performance or story
                worth sharing? Registered members can propose it — an admin reviews it before it goes live.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2">
                <Link
                  href={profile ? "/dashboard/events" : "/auth/register"}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber text-navy text-sm font-extrabold hover:bg-amber-strong hover:text-white transition-colors font-sans"
                >
                  Propose an event →
                </Link>
                <Link
                  href="/submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors font-sans"
                >
                  Write a story
                </Link>
              </div>
            </div>
          ) : (
            <>
              {(featuredEvent || featuredPost) && (
                <div className="grid md:grid-cols-2 gap-4 mb-12">
                  {featuredEvent && (
                    <div className="bg-white rounded-2xl border-2 border-amber/60 p-5 sm:p-6 shadow-sm">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold tracking-widest uppercase text-amber-strong">
                          Featured event
                        </span>
                        <Badge variant={typeBadge[featuredEvent.type]}>
                          {featuredEvent.type}
                        </Badge>
                      </div>
                      <h2 className="text-lg font-extrabold text-navy tracking-tight mb-2">
                        {featuredEvent.title}
                      </h2>
                      <div className="flex flex-col gap-1.5 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray">
                          <Calendar size="14" /> {new Date(featuredEvent.date).toDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray">
                          <Clock size="14" /> {featuredEvent.time}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray">
                          <MapPin size="14" /> {featuredEvent.location}
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <span className="text-xs text-gray">
                          {featuredEvent.spots > 0
                            ? `${featuredEvent.spotsLeft} / ${featuredEvent.spots} spots left`
                            : "Open registration"}
                        </span>
                        <button
                          onClick={() => void toggle(featuredEvent.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer font-sans transition-colors ${
                            rsvps.has(featuredEvent.id)
                              ? "bg-green/10 text-green-800"
                              : "bg-navy text-white hover:bg-blue"
                          }`}
                        >
                          {rsvps.has(featuredEvent.id) ? "✓ Going" : "RSVP"}
                        </button>
                      </div>
                    </div>
                  )}
                  {featuredPost && (
                    <Link
                      href={`/news/${featuredPost.id}`}
                      className="bg-white rounded-2xl border border-border p-5 sm:p-6 shadow-sm hover:border-amber transition-colors block"
                    >
                      <div className="text-[10px] font-bold tracking-widest uppercase text-amber-strong mb-2">
                        Featured story · {featuredPost.category}
                      </div>
                      <h2 className="text-lg font-extrabold text-navy tracking-tight mb-2 leading-snug">
                        {featuredPost.title}
                      </h2>
                      {featuredPost.excerpt && (
                        <p className="text-sm text-gray leading-relaxed line-clamp-3 mb-3">
                          {featuredPost.excerpt}
                        </p>
                      )}
                      <span className="text-xs font-bold text-blue">
                        Read the story →
                      </span>
                    </Link>
                  )}
                </div>
              )}

              {events.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-end justify-between gap-3 mb-5">
                    <div>
                      <h2 className="text-lg font-extrabold text-navy tracking-tight">
                        Upcoming cultural events
                      </h2>
                      <p className="text-xs text-gray mt-0.5">
                        Approved, community-run gatherings — says &quot;Going&quot;, never attended.
                      </p>
                    </div>
                    <Link
                      href="/events"
                      className="text-xs font-bold text-blue hover:underline shrink-0"
                    >
                      All events →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((e) => {
                      const d = new Date(e.date);
                      return (
                        <div
                          key={e.id}
                          className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <div className="p-5">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <Badge variant={typeBadge[e.type]}>{e.type}</Badge>
                              {e.tags && e.tags.length > 0 && (
                                <span className="text-[10px] font-bold text-amber-strong uppercase tracking-wide shrink-0">
                                  {e.tags.slice(0, 2).join(" · ")}
                                </span>
                              )}
                            </div>
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
                              <button
                                onClick={() => void toggle(e.id)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer font-sans transition-colors ${
                                  rsvps.has(e.id)
                                    ? "bg-green/10 text-green-800"
                                    : "bg-navy text-white hover:bg-blue"
                                }`}
                              >
                                {rsvps.has(e.id) ? "✓ Going" : "RSVP"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {posts.length > 0 && (
                <div className="mb-12">
                  <div className="flex items-end justify-between gap-3 mb-5">
                    <div>
                      <h2 className="text-lg font-extrabold text-navy tracking-tight">
                        Stories &amp; features
                      </h2>
                      <p className="text-xs text-gray mt-0.5">
                        Music, craft, chieftaincy and the people behind them.
                      </p>
                    </div>
                    <Link href="/news" className="text-xs font-bold text-blue hover:underline shrink-0">
                      All community news →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {posts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/news/${p.id}`}
                        className="bg-white rounded-xl border border-border p-5 hover:border-amber hover:shadow-md transition-all block"
                      >
                        <div className="text-[10px] font-bold uppercase tracking-wide text-amber-strong mb-1.5">
                          {p.category}
                        </div>
                        <h3 className="text-sm font-extrabold text-navy leading-snug mb-2 line-clamp-2">
                          {p.title}
                        </h3>
                        {p.excerpt && (
                          <p className="text-xs text-gray leading-relaxed line-clamp-3">{p.excerpt}</p>
                        )}
                        <div className="mt-3 text-[11px] text-gray flex items-center gap-1.5">
                          <span className="font-bold text-navy">{p.authorName}</span> ·{" "}
                          {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ""}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {creators.length > 0 && (
                <div className="mb-12">
                  <div className="mb-5">
                    <h2 className="text-lg font-extrabold text-navy tracking-tight">Local creatives</h2>
                    <p className="text-xs text-gray mt-0.5">
                      Members whose words and work are making the culture section real.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {creators.slice(0, 6).map((c) => (
                      <Link
                        key={c.id}
                        href={`/people/${c.id}`}
                        className="bg-white rounded-xl border border-border p-4 hover:border-amber transition-colors flex items-center gap-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-pale border border-border flex items-center justify-center text-xs font-extrabold text-navy shrink-0">
                          {initials(c.name)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-navy truncate">{c.name}</div>
                          <div className="text-[11px] text-gray">
                            {c.postCount} {c.postCount === 1 ? "story" : "stories"}
                            {c.badge === "verified" ? " · Verified contributor" : ""}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-4 mb-12">
                {places.map((p) => (
                  <Link
                    key={p.title}
                    href={p.href}
                    className="bg-navy rounded-2xl p-5 text-white hover:bg-blue transition-colors block"
                  >
                    <p.icon size="20" className="text-amber mb-3" aria-hidden="true" />
                    <h3 className="text-sm font-extrabold mb-1.5">{p.title}</h3>
                    <p className="text-xs text-white/60 leading-relaxed mb-3">{p.body}</p>
                    <span className="text-[11px] font-bold text-amber">{p.cta} →</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-border p-6 sm:p-8 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-amber-strong mb-2">
              <PenLine size="14" /> Run something in Klagon
            </div>
            <h2 className="text-lg font-extrabold text-navy tracking-tight mb-1">
              Got a festival, performance or story?
            </h2>
            <p className="text-sm text-gray leading-relaxed mb-4 max-w-lg mx-auto">
              Any registered member can propose a cultural event — an admin reviews it before it goes
              live. Stories go through the same trusted review before they&apos;re published.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href={profile ? "/dashboard/events" : "/auth/register"}
                className="px-5 py-2.5 rounded-lg bg-amber text-navy text-xs font-extrabold hover:bg-amber-strong hover:text-white transition-colors font-sans"
              >
                Propose an event
              </Link>
              <Link
                href="/submit"
                className="px-5 py-2.5 rounded-lg bg-navy text-white text-xs font-bold hover:bg-blue transition-colors font-sans"
              >
                Write a story
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}