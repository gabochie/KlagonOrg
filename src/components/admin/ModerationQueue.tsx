"use client";

/**
 * Community portal moderation queue (admin only).
 * Pending submissions first; approve sets them live, reject requires a
 * reason the member sees under My Posts. Tabs cover the full lifecycle.
 */

import { useCallback, useEffect, useState } from "react";
import {
  POST_TYPE_LABELS,
  approvePost,
  fetchModerationQueue,
  rejectPost,
} from "@/lib/posts";
import type { Post, PostStatus } from "@/types";

const TABS: { id: PostStatus | "all"; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

export function ModerationQueue() {
  const [tab, setTab] = useState<PostStatus | "all">("pending");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    if (tab === "all") {
      const [p, a, r] = await Promise.all([
        fetchModerationQueue("pending"),
        fetchModerationQueue("approved"),
        fetchModerationQueue("rejected"),
      ]);
      setPosts([...p, ...a, ...r]);
    } else {
      setPosts(await fetchModerationQueue(tab));
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  async function approve(p: Post) {
    setBusy(p.id);
    setNotice(null);
    const res = await approvePost(p.id);
    if (!res.ok) setNotice(res.error ?? "Approve failed.");
    else await load();
    setBusy(null);
  }

  async function reject(p: Post) {
    if (reason.trim().length < 5) {
      setNotice("Give a reason of at least 5 characters — the member sees it.");
      return;
    }
    setBusy(p.id);
    setNotice(null);
    const res = await rejectPost(p.id, reason.trim());
    if (!res.ok) setNotice(res.error ?? "Reject failed.");
    else {
      setRejectId(null);
      setReason("");
      await load();
    }
    setBusy(null);
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div className="text-sm font-extrabold text-navy">Moderation</div>
          <div className="text-[11px] text-gray mt-0.5">
            Review community submissions before they go live
          </div>
        </div>
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setRejectId(null);
                setReason("");
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize cursor-pointer ${
                tab === t.id ? "bg-navy text-white" : "bg-light text-navy hover:bg-pale"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {notice && (
        <div className="text-[11px] font-semibold text-amber-800 bg-amber/10 rounded-lg px-3 py-2 mb-3">
          {notice}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-xs text-gray font-semibold">Loading queue…</div>
      ) : posts.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray">
          Queue clear. New member submissions will appear here.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
          {posts.map((p) => (
            <div key={p.id} className="rounded-xl border border-border p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-navy truncate">{p.title}</div>
                  <div className="text-[11px] text-gray truncate mt-0.5">
                    {POST_TYPE_LABELS[p.type]} · {p.category || "General"} · {p.authorName} ·{" "}
                    {new Date(p.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {p.excerpt && (
                    <div className="text-[11px] text-gray/80 truncate mt-0.5">{p.excerpt}</div>
                  )}
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-pale text-navy flex-shrink-0">
                  {p.status}
                </span>
              </div>
              {p.status === "pending" && (
                <div className="mt-2">
                  {rejectId === p.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason the member will see…"
                        className="w-full rounded-lg border border-border px-3 py-1.5 text-xs"
                      />
                      <div className="flex gap-1.5">
                        <button
                          disabled={busy === p.id}
                          onClick={() => void reject(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setRejectId(null);
                            setReason("");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-light text-navy text-[11px] font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        disabled={busy === p.id}
                        onClick={() => void approve(p)}
                        className="px-2.5 py-1.5 rounded-lg bg-navy text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setRejectId(p.id);
                          setReason("");
                          setNotice(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-light text-red-700 text-[11px] font-bold cursor-pointer"
                      >
                        Reject…
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
