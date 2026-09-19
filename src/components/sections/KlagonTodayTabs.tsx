"use client";

import { useEffect, useState } from "react";
import { fetchPublicPosts } from "@/lib/queries";
import { fetchPublicEvents } from "@/lib/queries";
import { COMMUNITY_SHOTS } from "@/lib/community";
import type { PostSummary, Event } from "@/types";

type Tab = "All" | "News" | "Jobs" | "Businesses" | "Events" | "Community" | "Opportunities";

const TABS: Tab[] = ["All", "News", "Jobs", "Businesses", "Events", "Community", "Opportunities"];

interface FeedItem {
  key: string;
  kind: Tab;
  title: string;
  excerpt: string;
  tag: string;
}

const JOBS_LABEL =
  "Klagon Jobs & Opportunities — real listings coming soon. This tab shows illustrative examples only. Nothing here is a live opening yet.";

function demoJobs(): FeedItem[] {
  return [
    {
      key: "opportunity-ai-course",
      kind: "Opportunities",
      title: "Free AI Skills for Klagon Youth",
      excerpt: "Structured course → project → portfolio path. First 5 lessons live now in the Learning Hub.",
      tag: "OPPORTUNITY",
    },
    {
      key: "business-digital",
      kind: "Businesses",
      title: "Get Your Business on the Klagon Digital Map",
      excerpt: "A verified profile, WhatsApp, and map pin so customers can find you. Claim your listing.",
      tag: "BUSINESS",
    },
  ];
}

export function KlagonTodayTabs() {
  const [tab, setTab] = useState<Tab>("All");
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [events, setEvents] = useState<Event[]>([] proiektuak;

  useEffect(() => {
    void fetchPublicPosts().then(setPosts);
    void fetchPublicEvents().then(setEvents);
  }, []);

  const items: FeedItem[] = [
    ...posts.map((p) => ({
      key: `post-${p.id}`,
      kind: "News" as Tab,
      title: p.title,
      excerpt: p.excerpt,
      tag: "NEWS",
    })),
    ...events.map((e) => ({
      key: `event-${e.id}`,
      kind: "Events" as Tab,
      title: e.title,
      excerpt: `${new Date(e.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · ${e.location}`,
      tag: "EVENT",
    })),
    ...COMMUNITY_SHOTS.slice(0, 6).map((s) => ({
      key: `community-${s.id}`,
      kind: "Community" as Tab,
      title: s.caption,
      excerpt: "Community photo — real moments from Klagon.",
      tag: "COMMUNITY",
    })),
    ...demoJobs(),
  ];

  const visible = tab === "All" ? items.filter((i) => i.kind !== "Jobs") : items.filter((i) => i.kind === tab);

  return (
    <section id="klagon-today" aria-labelledby="klagon-today-title" className="w-full bg-surface py-14 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-1 text-xs font-bold tracking-widest uppercase text-amber">Klagon Today</div>
        <h2 id="klagon-today-title" className="text-[clamp(1.5rem,3vw,2rem)] font-extrabold text-ink tracking-tight mb-1">
          What&apos;s happening in Klagon
        </h2>
        <p className="text-sm text-gray max-w-2xl mb-6">
          Local news, events, jobs and business openings — the daily heartbeat of Klagon, in one place.
        </p>

        <div role="tablist" aria-label="Klagon Today sections" className="flex flex-wrap gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              aria-controls="klagon-today-panel"
              id={`klagon-tab-${t.toLowerCase()}`}
              onClick={() => setTab(t)}
              className={
                "px-3 py-1.5 rounded-full text-sm font-semibold transition-colors " +
                (tab === t ? "bg-ink text-white" : "bg-white text-gray hover:bg-gray-100")
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="klagon-today-panel" aria-labelledby={`klagon-tab-${tab.toLowerCase()}`} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((i) => (
            <article key={i.key} className="border border-gray-100 rounded-2xl p-4 bg-white flex flex-col gap-2">
              <span
                className={
                  "w-fit text-[11px] font-bold tracking-widest uppercase px-2 py-0.5 rounded " +
                  (i.kind === "Events" || i.kind === "News" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50")
                }
              >
                {i.tag}
              </span>
              <h3 className="text-sm font-bold text-ink leading-snug">{i.title}</h3>
              <p className="text-xs text-gray leading-relaxed">{i.excerpt}</p>
            </article>
          ))}

          {visible.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3 text-center text-sm text-gray py-8">
              No {tab === "All" ? "live items" : tab.toLowerCase()} right now — new {tab === "All" ? "stories" : tab.toLowerCase()} land here first.
            </div>
          )}
        </div>

        <p className="mt-6 text-[11px] text-gray bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
          <strong>Klagon Today honesty note:</strong> News, Events and Community show real published items only.
          Jobs &amp; Businesses tabs show illustrative examples — real listings and verified openings are still coming soon. That distinction matters.
        </p>
      </div>
    </section>
  );
}
