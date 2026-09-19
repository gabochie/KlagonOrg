"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AREA_LABELS,
  CATEGORY_SEEDS,
  POST_TYPE_LABELS,
  fetchFeaturedPosts,
  fetchPortalPosts,
} from "@/lib/posts";
import type { Post, PostArea, PostType } from "@/types";

const TABS: Array<PostType | "all"> = [
  "all",
  "news",
  "event",
  "business",
  "classified",
  "job",
  "announcement",
];

const PAGE_SIZE = 12;

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AuthorLine({ post, light = false }: { post: Post; light?: boolean }) {
  return (
    <span className={light ? "text-white" : undefined}>
      {post.authorName}
      {post.authorBadge === "verified" && (
        <span className="text-blue font-bold" title="Verified member">
          {" "}
          ✓
        </span>
      )}
      {post.authorBadge === "editorial" && (
        <span className="text-amber-strong font-bold"> · Editorial</span>
      )}
    </span>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/news/${post.id}`}
      className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
    >
      {post.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverUrl}
          alt={post.title}
          className="h-32 w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="h-28 bg-pale flex items-center justify-center text-3xl">
          {post.type === "event" ? "📅" : post.type === "job" ? "💼" : post.type === "classified" ? "🏷️" : "📄"}
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber-800">
            {post.category || POST_TYPE_LABELS[post.type]}
          </span>
          {post.boostTier !== "none" && post.boostUntil && (
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber/15 text-amber-strong">
              ⚡ Featured
            </span>
          )}
        </div>
        <h2 className="text-sm font-bold text-navy leading-tight mb-1.5 group-hover:text-blue transition-colors">
          {post.title}
        </h2>
        <p className="text-xs text-gray leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>
        {post.priceGhs != null && (
          <div className="text-sm font-extrabold text-navy mb-2">
            GH₵ {post.priceGhs.toLocaleString()}
          </div>
        )}
        {post.type === "event" && post.eventDate && (
          <div className="text-[11px] font-semibold text-blue mb-2">
            📅 {fmtDate(post.eventDate)}
            {post.eventTime ? ` · ${post.eventTime}` : ""}
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-gray pt-2 border-t border-border">
          <AuthorLine post={post} />
          <span>
            {fmtDate(post.publishedAt ?? post.createdAt)} · {AREA_LABELS[post.area]}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function PortalFeed() {
  const [tab, setTab] = useState<PostType | "all">("all");
  const [area, setArea] = useState<PostArea | "all">("all");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [featured, setFeatured] = useState<Post[]>([]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setFeatured(await fetchFeaturedPosts(3));
    })();
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const data = await fetchPortalPosts({
        type: tab,
        area,
        category: category === "All" ? undefined : category,
        search: appliedQuery || undefined,
        limit,
      });
      if (active) {
        setPosts(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [tab, area, category, appliedQuery, limit]);

  const categories = tab === "all" ? [] : CATEGORY_SEEDS[tab];
  const hasMore = posts.length >= limit;

  const onTab = (t: PostType | "all") => {
    setTab(t);
    setCategory("All");
    setLimit(PAGE_SIZE);
  };

  return (
    <div className="w-full">
      {featured.length > 0 && tab === "all" && !appliedQuery && (
        <div className="mb-10">
          <h2 className="text-sm font-extrabold text-navy mb-3">⚡ Featured in the community</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featured.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => onTab("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer font-sans transition-colors ${
            tab === "all"
              ? "bg-navy text-white"
              : "bg-white text-gray border border-border hover:border-navy"
          }`}
        >
          All
        </button>
        {TABS.filter((t) => t !== "all").map((t) => (
          <button
            key={t}
            onClick={() => onTab(t)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer font-sans transition-colors ${
              tab === t
                ? "bg-navy text-white"
                : "bg-white text-gray border border-border hover:border-navy"
            }`}
          >
            {POST_TYPE_LABELS[t as PostType]}
          </button>
        ))}
      </div>

      {tab === "job" && (
        <div className="text-right mb-4 -mt-1">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-blue transition-colors"
          >
            Open the full jobs board →
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setLimit(PAGE_SIZE);
            setAppliedQuery(query.trim());
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="flex-1 px-3 py-2 rounded-xl bg-white border border-border text-sm text-navy placeholder:text-gray/60 focus:outline-none focus:border-navy"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-blue transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>
        <select
          value={area}
          onChange={(e) => {
            setArea(e.target.value as PostArea | "all");
            setLimit(PAGE_SIZE);
          }}
          className="px-3 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-navy cursor-pointer"
          aria-label="Filter by area"
        >
          <option value="all">All areas</option>
          {(Object.keys(AREA_LABELS) as PostArea[]).map((a) => (
            <option key={a} value={a}>
              {AREA_LABELS[a]}
            </option>
          ))}
        </select>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-6">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setLimit(PAGE_SIZE);
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                category === c
                  ? "bg-amber text-navy"
                  : "bg-white text-gray border border-border hover:border-navy"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-pulse text-sm text-gray font-semibold">Loading posts…</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-10 text-center">
          <div className="text-3xl mb-3">📭</div>
          <div className="text-sm font-extrabold text-navy mb-1">No stories here yet</div>
          <p className="text-xs text-gray mb-4">
            Be the first to share — every post is reviewed before it goes live.
          </p>
          <Link
            href="/submit"
            className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-blue transition-colors"
          >
            Post to the community →
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
                className="px-6 py-2.5 rounded-xl bg-white border border-border text-navy text-xs font-bold hover:border-navy transition-colors cursor-pointer"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
