"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  POST_TYPE_LABELS,
  deleteMyPost,
  fetchMyPosts,
  updateMyPost,
} from "@/lib/posts";
import type { Post } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber/15 text-amber-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-50 text-red-700",
  hidden: "bg-pale text-gray",
};

export default function MyPostsPage() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [fetching, setFetching] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setFetching(false);
      return;
    }
    setFetching(true);
    setPosts(await fetchMyPosts(user.id));
    setFetching(false);
  }, [user]);

  useEffect(() => {
    if (loading) return;
    void (async () => {
      await load();
    })();
  }, [loading, load]);

  async function saveEdit(p: Post) {
    if (editTitle.trim().length < 5) {
      setNotice("Title needs at least 5 characters.");
      return;
    }
    setBusy(p.id);
    setNotice(null);
    const res = await updateMyPost(p.id, { title: editTitle.trim(), body: editBody.trim() || undefined });
    if (!res.ok) setNotice(res.error ?? "Could not save. Only pending posts can be edited.");
    else {
      setEditingId(null);
      await load();
    }
    setBusy(null);
  }

  async function remove(p: Post) {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    setBusy(p.id);
    setNotice(null);
    const res = await deleteMyPost(p.id);
    if (!res.ok) setNotice(res.error ?? "Could not delete.");
    else await load();
    setBusy(null);
  }

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Member Submissions
            </div>
            <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              My Posts
            </h1>
            <p className="text-sm text-white/70 leading-relaxed">
              Track reviews, edit while pending, and see admin notes on returned posts.
            </p>
          </div>
        </section>

        <section className="py-10 sm:py-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            {loading || fetching ? (
              <div className="text-center text-sm text-gray py-10">Loading your posts…</div>
            ) : !user ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center">
                <div className="text-sm font-bold text-navy mb-2">Sign in to see your posts</div>
                <Link href="/auth/login">
                  <Button variant="primary">Log In →</Button>
                </Link>
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center">
                <div className="text-sm font-bold text-navy mb-2">Nothing submitted yet</div>
                <p className="text-sm text-gray mb-4">Your first post takes two minutes.</p>
                <Link href="/submit">
                  <Button variant="primary">Submit a Post →</Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {notice && (
                  <div className="text-xs font-semibold text-amber-800 bg-amber/10 rounded-lg px-3 py-2">
                    {notice}
                  </div>
                )}
                {posts.map((p) => (
                  <div key={p.id} className="bg-white border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="text-sm font-bold text-navy">{p.title}</div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                          STATUS_STYLE[p.status] ?? STATUS_STYLE.hidden
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray mb-2">
                      {POST_TYPE_LABELS[p.type]} · {p.category || "General"} ·{" "}
                      {new Date(p.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    {p.status === "rejected" && p.rejectedReason && (
                      <div className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-2">
                        Admin notes: {p.rejectedReason}
                      </div>
                    )}
                    {editingId === p.id ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <Input
                          label="Title"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                        <label className="text-xs font-bold text-navy">
                          Details
                          <textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
                          />
                        </label>
                        <div className="flex gap-2">
                          <button
                            disabled={busy === p.id}
                            onClick={() => void saveEdit(p)}
                            className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 rounded-lg bg-light text-navy text-xs font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {p.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                setEditingId(p.id);
                                setEditTitle(p.title);
                                setEditBody(p.body);
                                setNotice(null);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-light text-navy text-xs font-bold cursor-pointer hover:bg-pale"
                            >
                              Edit
                            </button>
                            <button
                              disabled={busy === p.id}
                              onClick={() => void remove(p)}
                              className="px-3 py-1.5 rounded-lg bg-light text-red-700 text-xs font-bold cursor-pointer hover:bg-pale disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {p.status === "rejected" && (
                          <span className="text-[11px] text-gray italic">
                            Fix the notes above, delete this, and submit fresh.
                          </span>
                        )}
                        {p.status === "approved" && (
                          <span className="text-[11px] font-bold text-green-800">
                            Live on the portal feed.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
