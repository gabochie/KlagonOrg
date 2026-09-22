"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquareQuote, Pin, Lock, Pencil, Trash2, Reply } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  createReply,
  deleteReply,
  deleteThread,
  fetchThread,
  updateThread,
  type ForumReply,
  type ForumThread,
} from "@/lib/forum";
import { Button, Card, Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-border text-sm font-sans bg-white focus:outline-2 focus:outline-amber focus:border-transparent";
const labelCls = "text-xs font-semibold text-navy";

function Author({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Avatar initials={name.charAt(0).toUpperCase()} size="sm" />
      <span className="font-semibold text-navy">{name}</span>
    </span>
  );
}

export function ThreadDetail({ threadId }: { threadId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [thread, setThread] = useState<ForumThread | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);

  const [replyBody, setReplyBody] = useState("");
  const [replying, setReplying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const reload = useCallback(async () => {
    const res = await fetchThread(threadId);
    setThread(res.thread);
    setReplies(res.replies);
    setLoading(false);
  }, [threadId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await fetchThread(threadId);
      if (!active) return;
      setThread(res.thread);
      setReplies(res.replies);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [threadId]);

  if (loading) {
    return (
      <main className="bg-light min-h-screen">
        <div className="flex items-center justify-center gap-2 py-24 text-gray">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading thread…</span>
        </div>
      </main>
    );
  }

  if (!thread) {
    return (
      <main className="bg-light min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-3">
          <p className="text-sm text-gray">This thread could not be found.</p>
          <Link href="/forum" className="text-xs font-semibold text-blue hover:underline">
            ← Back to the forum
          </Link>
        </div>
      </main>
    );
  }

  const isAuthor = Boolean(user && user.id === thread.authorId);
  const current = thread;

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || current.closed) return;
    setBusy(true);
    setError(null);
    const res = await createReply(threadId, replyBody, user.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not post the reply.");
      return;
    }
    setReplyBody("");
    setReplying(false);
    await reload();
  }

  async function handleDeleteThread() {
    if (!isAuthor || !window.confirm("Delete this thread and all replies?")) return;
    const res = await deleteThread(threadId);
    if (res.ok) {
      router.push("/forum");
    } else {
      setError(res.error ?? "Could not delete the thread.");
    }
  }

  async function handleDeleteReply(id: string) {
    if (!window.confirm("Delete this reply?")) return;
    const res = await deleteReply(id);
    if (!res.ok) setError(res.error ?? "Could not delete the reply.");
    else await reload();
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await updateThread(threadId, { title, body });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not save changes.");
      return;
    }
    setEditing(false);
    await reload();
  }

  return (
    <main className="w-full">
      <section className="bg-navy py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-2">
            <Link href="/forum" className="hover:underline">
              Community Forum
            </Link>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
            <span>by {thread.author?.name ?? "Community Member"}</span>
            <span>·</span>
            <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
            {thread.pinned && (
              <span className="inline-flex items-center gap-1 text-amber font-bold uppercase tracking-wide">
                <Pin className="h-3 w-3" /> Pinned
              </span>
            )}
            {thread.closed && (
              <span className="inline-flex items-center gap-1 text-white/70 font-semibold">
                <Lock className="h-3 w-3" /> Closed
              </span>
            )}
          </div>
          {editing ? (
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <input
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-lg font-bold text-white focus:outline-2 focus:outline-amber"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                minLength={3}
                required
              />
              <textarea
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white min-h-32 resize-y focus:outline-2 focus:outline-amber"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                minLength={2}
                maxLength={20000}
                required
              />
              {error && <p className="text-xs text-amber">{error}</p>}
              <div className="flex items-center gap-2">
                <Button type="submit" variant="primary" size="sm" disabled={busy}>
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <h1 className="text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold text-white tracking-tight leading-tight mb-4">
                {thread.title}
              </h1>
              <div className="text-white/85 text-sm sm:text-base whitespace-pre-wrap">
                {thread.body}
              </div>
              {isAuthor && (
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(true);
                      setTitle(thread.title);
                      setBody(thread.body);
                    }}
                    disabled={thread.closed}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteThread}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
      <section className="bg-light py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-navy flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4" /> {thread.replyCount} replies
            </h2>
            {!user && (
              <span className="text-xs text-gray">
                <Link href="/auth/login" className="font-semibold text-blue hover:underline">
                  Log in
                </Link>{" "}
                to reply
              </span>
            )}
            {user && !thread.closed && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setReplying((r) => !r)}
              >
                <Reply className="h-3.5 w-3.5" /> Reply
              </Button>
            )}
          </div>

          {user && thread.closed && (
            <p className="text-xs text-gray flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> This thread is closed to new replies.
            </p>
          )}

          {replying && !thread.closed && (
            <Card className="p-5">
              <form onSubmit={handleReply} className="space-y-3">
                <div>
                  <label className={labelCls} htmlFor="forum-reply">
                    Your reply
                  </label>
                  <textarea
                    id="forum-reply"
                    className={cn(inputCls, "min-h-28 resize-y")}
                    value={replyBody}
                    onChange={(e) => setReplyBody(e.target.value)}
                    maxLength={20000}
                    minLength={2}
                    required
                    placeholder="Add to the conversation…"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex items-center gap-2">
                  <Button type="submit" variant="primary" size="sm" disabled={busy}>
                    {busy ? "Posting…" : "Post reply"}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setReplying(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {replies.length === 0 ? (
            <p className="text-center text-sm text-gray py-8">
              No replies yet — start the conversation.
            </p>
          ) : (
            <div className="space-y-3">
              {replies.map((r) => (
                <Card key={r.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Author name={r.author?.name ?? "Community Member"} />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray" title={new Date(r.createdAt).toLocaleString()}>
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                      {user && user.id === r.authorId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-gray hover:text-red-600"
                          onClick={() => handleDeleteReply(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-navy/85 whitespace-pre-wrap">{r.body}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}