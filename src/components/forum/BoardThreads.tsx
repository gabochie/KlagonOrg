"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MessageSquareQuote, Pin, Lock, PenLine } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createThread, fetchThreads, type ForumThread } from "@/lib/forum";
import { ThreadDetail } from "@/components/forum/ThreadDetail";
import { Button, Card, CardSub } from "@/components/ui";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-border text-sm font-sans bg-white focus:outline-2 focus:outline-amber focus:border-transparent";
const labelCls = "text-xs font-semibold text-navy";

export function BoardThreads({ boardId }: { boardId: string }) {
  return (
    <Suspense fallback={<ForumLoading />}>
      <BoardContent boardId={boardId} />
    </Suspense>
  );
}

function ForumLoading() {
  return (
    <main className="w-full bg-light min-h-svh">
      <div className="flex items-center justify-center gap-2 py-24 text-gray">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading forum…</span>
      </div>
    </main>
  );
}

function BoardContent({ boardId }: { boardId: string }) {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get("t");

  if (threadId) {
    return (
      <div>
        <div className="bg-navy px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            <Link
              href={`/forum/${boardId}`}
              className="text-xs font-semibold text-white/70 hover:text-amber hover:underline"
            >
              ← Back to this board
            </Link>
          </div>
        </div>
        <ThreadDetail threadId={threadId} />
      </div>
    );
  }
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardName, setBoardName] = useState("");

  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [ts, boards] = await Promise.all([
        fetchThreads(boardId),
        import("@/lib/forum").then((m) => m.fetchBoards()),
      ]);
      if (!active) return;
      setThreads(ts);
      setBoardName(boards.find((b) => b.id === boardId)?.name ?? "Forum");
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [boardId]);

  const signIn = !user && !authLoading;

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    const res = await createThread(boardId, title, body, user.id);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Could not start the thread.");
      return;
    }
    setTitle("");
    setBody("");
    setComposing(false);
    router.push(`/forum/${boardId}?t=${res.id}`);
  }

  return (
    <main className="w-full">
      <section className="bg-navy py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-2">
            <Link href="/forum" className="hover:underline">
              Community Forum
            </Link>
          </div>
          <h1 className="text-[clamp(1.6rem,3vw,2.4rem)] font-extrabold text-white tracking-tight leading-tight">
            {boardName || "Forum"}
          </h1>
        </div>
      </section>
      <section className="bg-light py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/forum"
              className="text-xs font-semibold text-blue hover:underline"
            >
              ← All boards
            </Link>
            {!signIn && (
              <Button
                type="button"
                variant="primary"
                onClick={() => setComposing((c) => !c)}
              >
                <PenLine className="h-4 w-4" /> New thread
              </Button>
            )}
          </div>

          {signIn && (
            <p className="text-sm text-gray rounded-xl bg-white border border-border px-4 py-3">
              Please{" "}
              <Link href="/auth/login" className="font-semibold text-blue hover:underline">
                log in
              </Link>{" "}
              or{" "}
              <Link href="/auth/register" className="font-semibold text-blue hover:underline">
                join Klagon
              </Link>{" "}
              to start a thread. Read freely as a guest.
            </p>
          )}

          {composing && (
            <Card className="p-5">
              <form onSubmit={handleStart} className="space-y-3">
                <div>
                  <label className={labelCls} htmlFor="forum-title">
                    Title
                  </label>
                  <input
                    id="forum-title"
                    className={inputCls}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={120}
                    minLength={3}
                    required
                    placeholder="What’s on your mind?"
                  />
                </div>
                <div>
                  <label className={labelCls} htmlFor="forum-body">
                    Your message
                  </label>
                  <textarea
                    id="forum-body"
                    className={cn(inputCls, "min-h-32 resize-y")}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={20000}
                    minLength={2}
                    required
                    placeholder="Share your thoughts with the community…"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <div className="flex items-center gap-2">
                  <Button type="submit" variant="primary" disabled={busy}>
                    {busy ? "Posting…" : "Start thread"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setComposing(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading threads…</span>
            </div>
          ) : threads.length === 0 ? (
            <p className="text-center text-sm text-gray py-12">
              No threads yet{profile ? " — be the first to start one!" : "."}
            </p>
          ) : (
            <div className="space-y-3">
              {threads.map((t) => (
                <Link key={t.id} href={`/forum/${boardId}?t=${t.id}`} className="group block">
                  <Card className="hover:border-amber transition-colors">
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {t.pinned && (
                              <span className="inline-flex items-center gap-1 text-amber text-xs font-bold uppercase tracking-wide">
                                <Pin className="h-3.5 w-3.5" /> Pinned
                              </span>
                            )}
                            {t.closed && (
                              <span className="inline-flex items-center gap-1 text-gray text-xs font-semibold">
                                <Lock className="h-3.5 w-3.5" /> Closed
                              </span>
                            )}
                            <h3 className="font-semibold text-navy group-hover:text-blue transition-colors leading-snug">
                              {t.title}
                            </h3>
                          </div>
                          <div className="mt-1 text-xs text-gray flex items-center gap-2 flex-wrap">
                            <span>by {t.author?.name ?? "Community Member"}</span>
                            <span>·</span>
                            <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <MessageSquareQuote className="h-3 w-3" /> {t.replyCount}
                            </span>
                          </div>
                        </div>
                        <CardSub className="hidden sm:block text-xs whitespace-nowrap">
                          {t.lastReplyAt
                            ? `Last reply ${new Date(t.lastReplyAt).toLocaleDateString()}`
                            : "No replies yet"}
                        </CardSub>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}