"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button, Input } from "@/components/ui";
import { Turnstile } from "@/components/Turnstile";
import { useAuth } from "@/components/auth/AuthProvider";
import { verifyTurnstile } from "@/lib/turnstile";
import { BoostRibbon, PostCard } from "@/components/posts/PostCard";
import {
  AREA_LABELS,
  POST_TYPE_LABELS,
  fetchPortalPosts,
  fetchPostById,
  recordPostView,
  reportPost,
  sendContactMessage,
} from "@/lib/posts";
import type { Post } from "@/types";

function Detail() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportReason, setReportReason] = useState("");
  const [reportState, setReportState] = useState<"idle" | "sending" | "done" | string>("idle");
  const [relayName, setRelayName] = useState("");
  const [relayPhone, setRelayPhone] = useState("");
  const [relayMsg, setRelayMsg] = useState("");
  const [relayState, setRelayState] = useState<"idle" | "sending" | "done" | string>("idle");
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    void (async () => {
      const p = await fetchPostById(id);
      setPost(p);
      setLoading(false);
      if (p && p.status === "approved") {
        try {
          if (!sessionStorage.getItem(`viewed:${id}`)) {
            sessionStorage.setItem(`viewed:${id}`, "1");
            void recordPostView(id);
          }
        } catch {
          /* private mode — views simply aren't counted */
        }
        setRelated(
          (await fetchPortalPosts({ type: p.type, limit: 4 })).filter((r) => r.id !== p.id).slice(0, 3)
        );
      }
    })();
  }, [id]);

  async function sendReport() {
    if (!user || reportReason.trim().length < 3) return;
    setReportState("sending");
    const res = await reportPost(id, user.id, reportReason.trim());
    setReportState(res.ok ? "done" : (res.error ?? "failed"));
  }

  async function sendRelay(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setRelayState("Complete the human check first.");
      return;
    }
    if (relayMsg.trim().length < 5) {
      setRelayState("Write a message of at least 5 characters.");
      return;
    }
    setRelayState("sending");
    const check = await verifyTurnstile(token);
    if (!check.success) {
      setRelayState(check.error ?? "Human check failed.");
      return;
    }
    const res = await sendContactMessage({
      post_id: id,
      sender_name: relayName.trim() || null,
      sender_phone: relayPhone.trim() || null,
      message: relayMsg.trim(),
    });
    setRelayState(res.ok ? "done" : (res.error ?? "failed"));
  }

  function shareWhatsApp() {
    const url = `https://klagon.org/news/post?id=${id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`${post?.title ?? "Community post"} ${url}`)}`, "_blank");
  }

  function copyLink() {
    const url = `https://klagon.org/news/post?id=${id}`;
    void navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main className="w-full">
      {loading ? (
        <section className="py-20 text-center text-sm text-gray">Loading post…</section>
      ) : !post || post.status !== "approved" ? (
        <section className="py-20 px-4 text-center">
          <div className="text-lg font-extrabold text-navy mb-2">Post not found</div>
          <p className="text-sm text-gray mb-5">
            It may still be under review or have been removed.
          </p>
          <Link
            href="/news"
            className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold"
          >
            Back to News
          </Link>
        </section>
      ) : (
        <>
          <section className="bg-navy py-12 sm:py-14 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber">
                  {post.category || POST_TYPE_LABELS[post.type]}
                </span>
                <span className="text-[11px] text-white/60">{AREA_LABELS[post.area]}</span>
              </div>
              <h1 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
                {post.title}
              </h1>
              <div className="text-xs text-white/60">
                {post.authorName}
                {post.authorBadge !== "member" && (
                  <span className="ml-1 font-bold text-amber">· {post.authorBadge}</span>
                )}{" "}
                ·{" "}
                {new Date(post.publishedAt ?? post.createdAt).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </section>

          <section className="py-8 sm:py-10 px-4 sm:px-6">
            <div className="max-w-3xl mx-auto">
              <BoostRibbon until={post.boostUntil} />
              {post.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverUrl} alt="" className="w-full rounded-2xl object-cover mb-6" />
              )}
              {post.priceGhs != null && (
                <div className="text-2xl font-extrabold text-navy mb-4">
                  GH₵ {Number(post.priceGhs).toLocaleString()}
                </div>
              )}
              {post.type === "event" && (post.eventDate || post.eventLocation) && (
                <div className="bg-pale border border-border rounded-xl p-4 mb-6 text-sm text-navy">
                  {[post.eventDate, post.eventTime].filter(Boolean).join(" · ")}
                  {post.eventLocation && <div className="text-xs text-gray mt-1">{post.eventLocation}</div>}
                </div>
              )}
              {post.excerpt && (
                <p className="text-sm font-bold text-navy leading-relaxed mb-4">{post.excerpt}</p>
              )}
              {post.body ? (
                <div className="text-sm text-gray leading-relaxed whitespace-pre-wrap mb-8">
                  {post.body}
                </div>
              ) : (
                <div className="mb-8" />
              )}

              {(post.type === "classified" || post.type === "business" || post.type === "job") && (
                <div className="bg-white border border-border rounded-2xl p-5 mb-6">
                  <div className="text-sm font-extrabold text-navy mb-2">Contact the poster</div>
                  {user && post.contactPhone ? (
                    <div className="flex flex-col gap-2">
                      <a
                        href={`tel:${post.contactPhone.replace(/\s/g, "")}`}
                        className="text-sm font-bold text-navy"
                      >
                        {post.contactPhone}
                      </a>
                      {post.contactEmail && (
                        <a href={`mailto:${post.contactEmail}`} className="text-sm text-gray">
                          {post.contactEmail}
                        </a>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={sendRelay} className="flex flex-col gap-2">
                      <p className="text-[11px] text-gray">
                        {user
                          ? "The poster did not leave a number — send them a message instead."
                          : "Sign in to see the number, or send a message below."}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          label="Your name"
                          value={relayName}
                          onChange={(e) => setRelayName(e.target.value)}
                        />
                        <Input
                          label="Your phone"
                          value={relayPhone}
                          onChange={(e) => setRelayPhone(e.target.value)}
                        />
                      </div>
                      <label className="text-xs font-bold text-navy">
                        Message
                        <textarea
                          value={relayMsg}
                          onChange={(e) => setRelayMsg(e.target.value)}
                          rows={3}
                          className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
                        />
                      </label>
                      <Turnstile onToken={setToken} />
                      <Button variant="primary" disabled={relayState === "sending"}>
                        {relayState === "sending" ? "Sending…" : "Send Message →"}
                      </Button>
                      {relayState === "done" && (
                        <div className="text-xs font-bold text-green-800">
                          Sent. The poster will reach out.
                        </div>
                      )}
                      {relayState !== "idle" && relayState !== "sending" && relayState !== "done" && (
                        <div className="text-xs font-semibold text-red-700">{relayState}</div>
                      )}
                    </form>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-8">
                <button
                  onClick={shareWhatsApp}
                  className="px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-bold cursor-pointer"
                >
                  Share on WhatsApp
                </button>
                <button
                  onClick={copyLink}
                  className="px-3 py-1.5 rounded-lg bg-light text-navy text-xs font-bold cursor-pointer hover:bg-pale"
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
              </div>

              <div className="bg-white border border-border rounded-2xl p-5 mb-8">
                <div className="text-sm font-extrabold text-navy mb-2">Report this post</div>
                {!user ? (
                  <p className="text-xs text-gray">
                    <Link href="/auth/login" className="font-bold text-navy underline">
                      Log in
                    </Link>{" "}
                    to flag scams, spam, or wrong information.
                  </p>
                ) : reportState === "done" ? (
                  <p className="text-xs font-bold text-green-800">
                    Reported. Three reports hide a post pending admin review.
                  </p>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="What's wrong? (e.g. scam, spam)"
                      className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs"
                    />
                    <button
                      onClick={() => void sendReport()}
                      disabled={reportState === "sending"}
                      className="px-3 py-1.5 rounded-lg bg-light text-red-700 text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {reportState === "sending" ? "Sending…" : "Report"}
                    </button>
                  </div>
                )}
                {reportState !== "idle" && reportState !== "sending" && reportState !== "done" && (
                  <div className="text-xs font-semibold text-red-700 mt-2">{reportState}</div>
                )}
              </div>

              {related.length > 0 && (
                <>
                  <h2 className="text-lg font-extrabold text-navy mb-3">Related</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {related.map((r) => (
                      <PostCard key={r.id} post={r} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}

export default function NewsPostPage() {
  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <Suspense fallback={<div className="py-20 text-center text-sm text-gray">Loading post…</div>}>
        <Detail />
      </Suspense>
      <Footer />
    </div>
  );
}
