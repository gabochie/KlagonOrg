"use client";

import { useEffect, useState } from "react";
import { AREA_LABELS, POST_TYPE_LABELS, approvePost, fetchModerationQueue, rejectPost } from "@/lib/posts";
import type { Post, PostStatus, PostType } from "@/types";
import { PostStatusChip } from "./PostStatusChip";

const STATUS_TABS: PostStatus[] = ["pending", "approved", "rejected", "hidden"];
const TYPE_FILTERS: (PostType | "all")[] = ["all", "news", "event", "business", "classified", "job", "announcement"];

const TAB_COLORS: Record<PostStatus, string> = {
  pending: "bg-amber text-navy",
  approved: "bg-emerald-500/15 text-emerald-700",
  rejected: "bg-red-500/10 text-red-700",
  hidden: "bg-gray-100 text-gray-600",
};

function fmt(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ModerationQueue() {
  const [status, setStatus] = useState<PostStatus>("pending");
  const [typeFilter, setTypeFilter] = useState<PostType | "all">("all");
  const [posts, setPosts] = useState<Post[]>([]);
  const [busy, setBusy] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      setBusy(true);
      const data = await fetchModerationQueue(status);
      if (active) {
        setPosts(data);
        setBusy(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [status]);

  const reload = async () => {
    setPosts(await fetchModerationQueue(status));
  };

  const onApprove = async (p: Post) => {
    const res = await approvePost(p.id);
    if (!res.ok) return window.alert(res.error ?? "Could not approve this post.");
    await reload();
  };

  const onReject = async (p: Post) => {
    if (!reason.trim()) return;
    setRejecting(true);
    const res = await rejectPost(p.id, reason.trim());
    setRejecting(false);
    if (!res.ok) return window.alert(res.error ?? "Could not reject this post.");
    setRejectId(null);
    setReason("");
    await reload();
  };

  const visible = typeFilter === "all" ? posts : posts.filter((p) => p.type === typeFilter);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setRejectId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              status === s ? TAB_COLORS[s] : "bg-white text-gray border border-border hover:bg-light"
            }`}
          >
            {s === "pending" ? "Pending" : s === "approved" ? "Live" : s === "rejected" ? "Rejected" : "Hidden"}
          </button>
        ))}
        <div className="ml-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as PostType | "all")}
            className="px-2.5 py-1.5 rounded-lg border border-border text-xs font-semibold text-navy bg-white cursor-pointer"
          >
            {TYPE_FILTERS.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All types" : POST_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {busy ? (
        <div className="py-16 text-center">
          <div className="animate-pulse text-xs text-gray font-semibold">Loading queue…</div>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex items-center justify-center">
          <div className="mx-auto max-w-md">
            <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-sm">
              <div className="text-3xl mb-3">🎉</div>
              <div className="text-sm font-bold text-navy mb-1">Queue is clear</div>
              <div className="text-xs text-gray">
                No {status === "pending" ? "pending" : status} posts match your filter.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visible.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-start gap-3.5">
                {p.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.coverUrl}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-pale flex items-center justify-center flex-shrink-0 border border-border">
                    <span className="text-lg">🖼️</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-amber-strong">
                      {POST_TYPE_LABELS[p.type]}
                      {p.category ? ` · ${p.category}` : ""}
                      {p.subcategory ? ` · ${p.subcategory}` : ""}
                    </span>
                    <PostStatusChip status={p.status} />
                  </div>
                  <div className="text-sm font-extrabold text-navy mt-0.5">{p.title}</div>
                  <div className="text-[11px] text-gray mt-0.5">
                    {p.authorName || "Community Member"} · {AREA_LABELS[p.area]} · submitted{" "}
                    {fmt(p.createdAt)}
                    {p.status === "hidden" ? ` · ${p.reports} report${p.reports === 1 ? "" : "s"}` : ""}
                  </div>
                  {p.excerpt && <div className="text-[11px] text-gray mt-1 line-clamp-2">{p.excerpt}</div>}
                  {p.rejectedReason && (
                    <div className="mt-1.5 text-[11px] text-red-700 bg-red-50 border border-red/30 rounded-lg px-2 py-1">
                      Reason: {p.rejectedReason}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                    <button
                      onClick={() => void onApprove(p)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 text-[11px] font-bold hover:bg-emerald-500/25 transition-colors cursor-pointer"
                    >
                      ✓ Approve
                    </button>
                    {status !== "rejected" && (
                      <button
                        onClick={() => {
                          setRejectId(p.id);
                          setReason("");
                        }}
                        className="px-2.5 py-1 rounded-lg text-red-700 text-[11px] font-bold hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        ✕ Reject
                      </button>
                    )}
                    {p.boostTier !== "none" && p.boostUntil && (
                      <span className="px-2 py-1 rounded-lg bg-amber/15 text-amber-strong text-[11px] font-bold">
                        ⚡ Boosted until {fmt(p.boostUntil)}
                      </span>
                    )}
                  </div>
                  {rejectId === p.id && (
                    <div className="mt-2.5 rounded-xl border border-red/30 bg-red-50/50 p-3">
                      <textarea
                        rows={2}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why are you rejecting this? The author will see this."
                        className="w-full px-3 py-2 rounded-lg border border-border text-sm font-sans bg-white focus:outline-2 focus:outline-red"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          disabled={rejecting || !reason.trim()}
                          onClick={() => void onReject(p)}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {rejecting ? "Rejecting…" : "Reject & notify"}
                        </button>
                        <button
                          onClick={() => setRejectId(null)}
                          className="px-3 py-1.5 rounded-lg border border-border text-navy text-[11px] font-bold hover:bg-light transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}