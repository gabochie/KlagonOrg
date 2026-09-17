"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import {
  AREA_LABELS,
  VERTICALS,
  fetchPortalPosts,
  type Vertical,
} from "@/lib/posts";
import type { Post, PostArea } from "@/types";

const AREAS: (PostArea | "all")[] = ["all", "klagon", "tema_west"];

type Sort = "newest" | "price-low" | "price-high";

export function ClassifiedsFeed({ initialVertical }: { initialVertical?: Vertical }) {
  const [vertical, setVertical] = useState<Vertical>(initialVertical ?? "Properties");
  const [area, setArea] = useState<PostArea | "all">("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setPosts(
        await fetchPortalPosts({ type: "classified", category: vertical, area, limit: 60 })
      );
      setLoading(false);
    })();
  }, [vertical, area]);

  const visible = useMemo(() => {
    const list = [...posts];
    if (sort === "price-low") list.sort((a, b) => (a.priceGhs ?? Infinity) - (b.priceGhs ?? Infinity));
    if (sort === "price-high") list.sort((a, b) => (b.priceGhs ?? -1) - (a.priceGhs ?? -1));
    return list;
  }, [posts, sort]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {VERTICALS.map((v) => (
          <button
            key={v}
            onClick={() => setVertical(v)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
              vertical === v
                ? "bg-navy text-white border-navy"
                : "bg-white text-gray border-border hover:border-navy"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-6">
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
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          className="ml-auto rounded-lg border border-border px-2 py-1 text-[11px] font-bold text-navy"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: low first</option>
          <option value="price-high">Price: high first</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-sm text-gray py-10">Loading marketplace…</div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-8 text-center">
          <div className="text-sm font-bold text-navy mb-2">Nothing listed in {vertical} yet</div>
          <p className="text-sm text-gray mb-4">Be the first — listing is free.</p>
          <Link href="/submit">
            <Button variant="primary">List Something →</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => (
            <Link
              key={p.id}
              href={`/news/${p.id}`}
              className="block bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4 sm:p-5">
                {p.subcategory && (
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber-800 mb-2">
                    {p.subcategory}
                  </span>
                )}
                <h2 className="text-sm font-bold text-navy leading-tight mb-1.5">{p.title}</h2>
                {p.excerpt && (
                  <p className="text-xs text-gray leading-relaxed mb-2">{p.excerpt}</p>
                )}
                {p.priceGhs != null && (
                  <div className="text-sm font-extrabold text-navy mb-2">
                    GH₵ {Number(p.priceGhs).toLocaleString()}
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-gray pt-2 border-t border-border">
                  <span>{AREA_LABELS[p.area]}</span>
                  <span>
                    {new Date(p.publishedAt ?? p.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
