"use client";

import { useState } from "react";
import Link from "next/link";
import { AREA_LABELS, POST_TYPE_LABELS } from "@/lib/posts";
import type { Post } from "@/types";

export function postHref(p: Pick<Post, "id">): string {
  return `/news/post?id=${p.id}`;
}

export function BoostRibbon({ until }: { until: string | null }) {
  // Pinned per mount: Date.now() is impure, so it may only run in the
  // state initializer, never in the render body (react-hooks/purity).
  const [now] = useState(() => Date.now());
  if (!until || new Date(until).getTime() < now) return null;
  const days = Math.max(1, Math.ceil((new Date(until).getTime() - now) / 86400000));
  return (
    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber text-navy mb-2">
      Featured · {days}d left
    </span>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={postHref(post)}
      className="block bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow"
    >
      {post.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverUrl} alt="" className="h-28 w-full object-cover" loading="lazy" />
      ) : (
        <div className="h-28 bg-pale flex items-center justify-center text-[11px] font-bold text-navy/40">
          {POST_TYPE_LABELS[post.type]}
        </div>
      )}
      <div className="p-4 sm:p-5">
        <BoostRibbon until={post.boostUntil} />
        <div className="flex items-center gap-1.5 mb-2">
          <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber-800">
            {post.category || POST_TYPE_LABELS[post.type]}
          </span>
          <span className="text-[10px] text-gray">{AREA_LABELS[post.area]}</span>
        </div>
        <h2 className="text-sm font-bold text-navy leading-tight mb-1.5">{post.title}</h2>
        {post.excerpt && <p className="text-xs text-gray leading-relaxed mb-3">{post.excerpt}</p>}
        {post.priceGhs != null && (
          <div className="text-sm font-extrabold text-navy mb-2">
            GH₵ {Number(post.priceGhs).toLocaleString()}
          </div>
        )}
        <div className="flex items-center justify-between text-[10px] text-gray pt-2 border-t border-border">
          <span>
            {post.authorName}
            {post.authorBadge !== "member" && (
              <span className="ml-1 font-bold text-navy">· {post.authorBadge}</span>
            )}
          </span>
          <span>
            {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
