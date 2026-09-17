"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { PostCard } from "@/components/posts/PostCard";
import {
  AREA_LABELS,
  POST_TYPE_LABELS,
  fetchFeaturedPosts,
  fetchPortalPosts,
} from "@/lib/posts";
import type { Post, PostArea, PostType } from "@/types";

const TABS: (PostType | "all")[] = ["all", "news", "event", "business", "classified", "job", "announcement"];
const AREAS: (PostArea | "all")[] = ["all", "klagon", "tema_west"];

export function NewsSection() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [featured, setFeatured] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<PostType | "all">("all");
  const [area, setArea] = useState<PostArea | "all">("all");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [feed, feat] = await Promise.all([
        fetchPortalPosts({ type: tab, area, search: query || undefined, limit: 60 }),
        tab === "all" && !query ? fetchFeaturedPosts(3) : Promise.resolve([] as Post[]),
      ]);
      setPosts(feed);
      setFeatured(feat);
      setLoading(false);
    })();
  }, [tab, area, query]);

  const visible = useMemo(
    () => posts.filter((p) => !featured.some((f) => f.id === p.id)),
    [posts, featured]
  );

  return (
    <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Klagon + Tema West
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Community News Portal
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto mb-6">
            News, events, businesses, classifieds, and jobs — posted by members, reviewed by
            admins.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-lg mx-auto">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setQuery(search.trim());
              }}
              placeholder="Search posts…"
              className="flex-1 rounded-lg px-3 py-2 text-sm text-navy"
            />
            <Button variant="primary" onClick={() => setQuery(search.trim())}>
              Search
            </Button>
            <Link href="/submit">
              <Button variant="dark">Post Free →</Button>
            </Link>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="bg-amber/10 py-8 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-xs font-bold tracking-widest uppercase text-amber-strong mb-3">
              Featured
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer font-sans transition-colors ${
                  tab === t
                    ? "bg-navy text-white"
                    : "bg-white text-gray border border-border hover:border-navy"
                }`}
              >
                {t === "all" ? "All" : POST_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-8">
            {AREAS.map((a) => (
              <button
                key={a}
                onClick={() => setArea(a)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer border transition-colors ${
                  area === a
                    ? "bg-amber text-navy border-amber"
                    : "bg-white text-gray border-border hover:border-navy"
                }`}
              >
                {a === "all" ? "All areas" : AREA_LABELS[a]}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center text-sm text-gray py-10">Loading the feed…</div>
          ) : visible.length === 0 ? (
            <div className="bg-white border border-border rounded-2xl p-8 text-center">
              <div className="text-sm font-bold text-navy mb-2">Nothing here yet</div>
              <p className="text-sm text-gray mb-4">
                Be the first to post in this section — it takes two minutes and it is free.
              </p>
              <Link href="/submit">
                <Button variant="primary">Submit a Post →</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
