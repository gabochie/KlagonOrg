"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Phone, MessageCircle, CalendarClock, ChevronRight } from "lucide-react";
import { AREA_LABELS, CATEGORY_SEEDS, fetchPortalPosts, isPostExpired } from "@/lib/posts";
import type { Post, PostArea } from "@/types";

const JOB_CATEGORIES = CATEGORY_SEEDS["job"];

const PAGE_SIZE = 12;

type SortKey = "newest" | "closing";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function waDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = `233${d.slice(1)}`;
  if (!d.startsWith("233")) d = `233${d}`;
  return d;
}

const chip =
  "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold bg-white border border-border text-gray hover:border-navy hover:text-navy cursor-pointer transition-colors font-sans whitespace-nowrap";
const chipOn = "bg-navy text-white border-navy hover:text-white";
const btn =
  "inline-flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors cursor-pointer font-sans";

function JobCard({ post }: { post: Post }) {
  const expired = isPostExpired(post);
  return (
    <Link
      href={`/news/${post.id}`}
      className="group bg-white rounded-2xl border border-border p-5 flex flex-col gap-3 hover:border-navy/30 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-pale border border-border flex items-center justify-center text-xl flex-shrink-0">
          💼
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span className="px-2 py-0.5 rounded-full bg-amber/15 text-amber-800 text-[10px] font-bold tracking-wide uppercase">
              {post.category}
            </span>
            {post.boostTier !== "none" && post.boostUntil && (
              <span className="px-2 py-0.5 rounded-full bg-amber/15 text-amber-strong text-[10px] font-bold">
                ⚡ Featured
              </span>
            )}
          </div>
          <h2 className="text-sm font-extrabold text-navy leading-snug group-hover:text-blue transition-colors">
            {post.title}
          </h2>
        </div>
      </div>

      <p className="text-xs text-gray leading-relaxed line-clamp-2">{post.excerpt}</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-gray font-medium">
        <span className="inline-flex items-center gap-1">
          <MapPin size="11" className="text-navy/40" /> {AREA_LABELS[post.area]}
        </span>
        {post.expiresAt && (
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              expired ? "text-red-700" : "text-amber-strong"
            }`}
          >
            <CalendarClock size="11" />
            {expired ? "Closed" : `Closes ${fmtDate(post.expiresAt)}`}
          </span>
        )}
      </div>

      <div className="flex items-stretch gap-2 mt-auto pt-1">
        {post.contactPhone && waDigits(post.contactPhone) && (
          <>
            <a
              href={`https://wa.me/${waDigits(post.contactPhone)}?text=${encodeURIComponent(
                `Hi, I saw the "${post.title}" listing on KLAGON.org and I'm interested.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btn} ${expired ? "pointer-events-none opacity-40" : ""} bg-navy text-white hover:bg-blue flex-1`}
            >
              <MessageCircle size="13" /> Apply on WhatsApp
            </a>
            <a
              href={`tel:${post.contactPhone.replace(/\D/g, "")}`}
              className={`${btn} bg-white text-navy border border-border hover:border-navy flex-1`}
            >
              <Phone size="13" /> Call
            </a>
          </>
        )}
        {!post.contactPhone && (
          <span className="flex-1 text-[11px] text-gray font-semibold px-1 py-2">
            Open the listing for contact details.
          </span>
        )}
      </div>
    </Link>
  );
}

export function JobsBoard() {
  const [category, setCategory] = useState("All");
  const [area, setArea] = useState<PostArea | "all">("all");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [jobs, setJobs] = useState<Post[]>([]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const data = await fetchPortalPosts({
        type: "job",
        area,
        category: category === "All" ? undefined : category,
        search: appliedQuery || undefined,
        limit,
      });
      if (active) {
        setJobs(data);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [category, area, appliedQuery, limit]);

  const visible = [...jobs].sort((a, b) => {
    if (sort === "closing") {
      const ae = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.POSITIVE_INFINITY;
      const be = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.POSITIVE_INFINITY;
      return ae - be;
    }
    return new Date(b.publishedAt ?? b.createdAt).getTime() - new Date(a.publishedAt ?? a.createdAt).getTime();
  });

  const hasMore = jobs.length >= limit;

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <form
          className="flex flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setLimit(PAGE_SIZE);
            setAppliedQuery(query.trim());
          }}
        >
          <div className="relative flex-1">
            <Search
              size="15"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search jobs, skills, keywords…"
              className="w-full px-3 py-2 pl-9 rounded-xl bg-white border border-border text-sm text-navy placeholder:text-gray/60 focus:outline-none focus:border-navy font-sans"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-blue transition-colors cursor-pointer font-sans"
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
          className="px-3 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-navy cursor-pointer font-sans"
          aria-label="Filter by area"
        >
          <option value="all">All areas</option>
          {(Object.keys(AREA_LABELS) as PostArea[]).map((a) => (
            <option key={a} value={a}>
              {AREA_LABELS[a]}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 rounded-xl bg-white border border-border text-xs font-semibold text-navy cursor-pointer font-sans"
          aria-label="Sort jobs"
        >
          <option value="newest">Newest first</option>
          <option value="closing">Closing soon</option>
        </select>
      </div>

      <div className="flex gap-1.5 pb-5 overflow-x-auto mb-2">
        {["All", ...JOB_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => {
              setCategory(c);
              setLimit(PAGE_SIZE);
            }}
            className={`${chip} ${category === c ? chipOn : ""}`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-pulse text-sm text-gray font-semibold">Loading openings…</div>
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-light rounded-2xl border border-border p-10 text-center">
          <div className="text-3xl mb-3">💼</div>
          <p className="text-sm font-extrabold text-navy mb-1">No open listings right now</p>
          <p className="text-sm text-gray max-w-md mx-auto">
            New openings appear as soon as they&apos;re approved, and expire automatically after 30 days.
            Check back soon — or post a listing yourself.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
            <Link
              href="/submit"
              className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-blue transition-colors font-sans"
            >
              Post a job →
            </Link>
            <Link
              href="/news"
              className="inline-block px-5 py-2.5 rounded-xl bg-white border border-border text-navy text-xs font-bold hover:border-navy transition-colors font-sans"
            >
              Browse community posts
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map((p) => (
              <JobCard key={p.id} post={p} />
            ))}
          </div>
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
                className="px-6 py-2.5 rounded-xl bg-white border border-border text-navy text-xs font-bold hover:border-navy transition-colors cursor-pointer font-sans"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      <div className="mt-10 bg-navy rounded-2xl px-6 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <div className="flex-1">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-2">
            Hiring in Klagon?
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
            Post a job or opportunity — free.
          </h2>
          <p className="text-white/70 text-sm max-w-lg">
            Jobs, gigs, apprenticeships, internships and volunteer roles. Reviewed before live; listings
            expire automatically after 30 days, so the board stays fresh.
          </p>
        </div>
        <Link
          href="/submit"
          className={`${btn} bg-amber text-navy hover:bg-amber-strong hover:text-white px-6 py-3.5 text-sm whitespace-nowrap`}
        >
          Post a listing <ChevronRight size="15" />
        </Link>
      </div>
    </div>
  );
}