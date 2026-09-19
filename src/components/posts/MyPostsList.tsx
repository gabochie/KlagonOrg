"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { AREA_LABELS, POST_TYPE_LABELS, deleteMyPost, fetchMyPosts, resubmitPost } from "@/lib/posts";
import type { Post } from "@/types";
import { PostStatusChip } from "./PostStatusChip";

function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function MyPostsList() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!user) {
        setBusy(false);
        return;
      }
      const data = await fetchMyPosts(user.id);
      if (active) setPosts(data);
      setBusy(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const reload = async () => {
    if (!user) return;
    setPosts(await fetchMyPosts(user.id));
  };

  const onDelete = async (p: Post) => {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    const res = await deleteMyPost(p.id);
    if (res.ok) await reload();
    else window.alert(res.error ?? "Could not delete post.");
  };

  const onResubmit = async (p: Post) => {
    const res = await resubmitPost(p.id);
    if (res.ok) await reload();
    else window.alert(res.error ?? "Could not resubmit post.");
  };

  if (busy) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-pulse text-sm text-gray font-semibold">Loading your posts…</div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
        <div className="text-3xl mb-3">🗞️</div>
        <div className="text-sm font-bold text-navy mb-1">No posts yet</div>
        <div className="text-xs text-gray mb-5">Share something with your community — it&apos;s free.</div>
        <Link
          href="/submit"
          className="inline-block px-4 py-2 rounded-lg bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
        >
          Submit your first post
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {posts.map((p) => (
        <div key={p.id} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            {p.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.coverUrl}
                alt=""
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-pale flex items-center justify-center flex-shrink-0 border border-border">
                <span className="text-xl">🖼️</span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-strong">
                  {POST_TYPE_LABELS[p.type]}
                  {p.type === "classified" && p.category ? ` · ${p.category}` : ""}
                </span>
                <PostStatusChip status={p.status} />
                {p.boostTier !== "none" && p.boostUntil && (
                  <span className="text-[10px] font-bold text-amber-strong bg-amber/15 px-1.5 py-0.5 rounded-full">
                    ⚡ Featured
                  </span>
                )}
              </div>
              <div className="text-sm font-extrabold text-navy truncate mt-0.5">{p.title}</div>
              <div className="text-[11px] text-gray mt-1">
                {fmt(p.createdAt)}
                {p.status === "approved" && p.publishedAt ? ` · live ${fmt(p.publishedAt)}` : ""}
                {p.area ? ` · ${AREA_LABELS[p.area]}` : ""}
                {p.type === "job" && p.expiresAt
                  ? new Date(p.expiresAt) <= new Date()
                    ? " · closed"
                    : ` · closes ${fmt(p.expiresAt)}`
                  : ""}
              </div>
              {p.status === "rejected" && p.rejectedReason && (
                <div className="mt-2 text-[11px] text-red-700 bg-red-50 border border-red/30 rounded-lg px-2.5 py-1.5">
                  <strong>Reason:</strong> {p.rejectedReason}
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {(p.status === "pending" || p.status === "rejected") && (
                  <Link
                    href={`/submit?edit=${p.id}`}
                    className="px-2.5 py-1 rounded-lg bg-pale text-navy text-[11px] font-bold hover:bg-pale/70 transition-colors"
                  >
                    Edit
                  </Link>
                )}
                {p.status === "rejected" && (
                  <button
                    onClick={() => void onResubmit(p)}
                    className="px-2.5 py-1 rounded-lg bg-navy text-white text-[11px] font-bold hover:bg-blue transition-colors cursor-pointer"
                  >
                    Resubmit
                  </button>
                )}
                {p.status === "approved" && (
                  <Link
                    href={`/news/${p.id}`}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 text-[11px] font-bold hover:bg-emerald-500/20 transition-colors"
                  >
                    View live
                  </Link>
                )}
                {(p.status === "pending" || p.status === "rejected") && (
                  <button
                    onClick={() => void onDelete(p)}
                    className="px-2.5 py-1 rounded-lg text-red-700 text-[11px] font-bold hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}