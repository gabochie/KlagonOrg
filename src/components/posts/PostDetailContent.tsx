"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  AREA_LABELS,
  POST_TYPE_LABELS,
  fetchPortalPosts,
  fetchPostById,
  isPostExpired,
  recordPostView,
  reportPost,
  sendContactMessage,
} from "@/lib/posts";
import type { Post } from "@/types";
import { ORG_WA } from "@/lib/wa";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function prettyKey(k: string): string {
  return k
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PostDetailContent({ id }: { id: string }) {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("Spam");
  const [reportState, setReportState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const [msgName, setMsgName] = useState("");
  const [msgPhone, setMsgPhone] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [msgState, setMsgState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msgError, setMsgError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      const data = await fetchPostById(id);
      if (!active) return;
      setPost(data);
      setLoading(false);
      if (data && data.status === "approved") {
        void recordPostView(id);
        const rel = await fetchPortalPosts({ type: data.type, limit: 4 });
        if (active) setRelated(rel.filter((r) => r.id !== id).slice(0, 3));
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-sm text-gray font-semibold">Loading post…</div>
      </div>
    );
  }

  if (!post || post.status !== "approved") {
    return (
      <section className="bg-light py-20 px-4 text-center">
        <div className="text-lg font-extrabold text-navy mb-2">Post unavailable</div>
        <p className="text-sm text-gray mb-5">
          This post may have been removed or is still under review.
        </p>
        <Link
          href="/news"
          className="inline-block px-5 py-2.5 rounded-xl bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
        >
          Back to Community
        </Link>
      </section>
    );
  }

  const pageUrl =
    typeof window !== "undefined" ? `${window.location.origin}/news/${post.id}` : "";
  const shareText = encodeURIComponent(post.title);

  const expired = isPostExpired(post);

  const claimable = post.details?.claimable === true;
  const claimHref = claimable
    ? `https://wa.me/${ORG_WA}?text=${encodeURIComponent(
        `Hi KLAGON! I want to claim this property listing: ${post.title} (${post.id})`
      )}`
    : null;

  const detailEntries = Object.entries(post.details).filter(
    ([, v]) => typeof v === "string" || typeof v === "number"
  ) as Array<[string, string | number]>;

  const onReport = async () => {
    if (!user) return;
    setReportState("sending");
    const res = await reportPost(post.id, user.id, reportReason);
    setReportState(res.ok ? "done" : "error");
  };

  const onContact = async (e: FormEvent) => {
    e.preventDefault();
    if (!msgBody.trim()) return;
    setMsgState("sending");
    setMsgError("");
    const res = await sendContactMessage({
      post_id: post.id,
      sender_name: msgName.trim() || null,
      sender_phone: msgPhone.trim() || null,
      sender_email: null,
      message: msgBody.trim(),
    });
    if (res.ok) {
      setMsgState("done");
      setMsgBody("");
    } else {
      setMsgState("error");
      setMsgError(res.error ?? "Could not send message.");
    }
  };

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <article className="w-full">
      <header className="bg-navy py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/60 mb-4">
            <Link href="/" className="hover:text-amber transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/news" className="hover:text-amber transition-colors">
              Community
            </Link>
            <span>/</span>
            <span className="text-white/80">{POST_TYPE_LABELS[post.type]}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber text-navy">
              {post.category || POST_TYPE_LABELS[post.type]}
            </span>
            {post.subcategory && (
              <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">
                {post.subcategory}
              </span>
            )}
            {post.boostTier !== "none" && post.boostUntil && (
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-amber">
                ⚡ Featured
              </span>
            )}
          </div>
          <h1 className="text-[clamp(1.6rem,3.4vw,2.5rem)] font-extrabold text-white tracking-tight leading-tight mb-4">
            {post.title}
          </h1>
          {post.excerpt && <p className="text-white/70 text-sm sm:text-base mb-5">{post.excerpt}</p>}
          {post.priceGhs != null && (
            <div className="text-xl font-extrabold text-amber mb-4">
              GH₵ {post.priceGhs.toLocaleString()}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-white/50">
            <span className="font-semibold text-white">
              {post.authorName}
              {post.authorBadge === "verified" && (
                <span className="text-blue font-bold" title="Verified member">
                  {" "}
                  ✓
                </span>
              )}
              {post.authorBadge === "editorial" && (
                <span className="text-amber font-bold"> · Editorial</span>
              )}
            </span>
            <span>·</span>
            <span>{AREA_LABELS[post.area]}</span>
            {post.publishedAt && (
              <>
                <span>·</span>
                <span>Published {fmtDate(post.publishedAt)}</span>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="bg-light py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          {expired && post.type === "job" && (
            <div className="bg-amber/15 border border-amber-strong/40 text-amber-strong rounded-xl p-4 mb-8">
              <div className="text-xs font-extrabold">This listing is closed</div>
              <div className="text-[11px] mt-0.5">
                It expired on {fmtDate(post.expiresAt)} and is no longer accepting applications.
              </div>
            </div>
          )}
          {post.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverUrl}
              alt={post.title}
              className="w-full max-h-96 object-cover rounded-xl border border-border mb-8"
            />
          )}

          {post.type === "event" && (post.eventDate || post.eventLocation) && (
            <div className="bg-white border border-border rounded-xl p-5 mb-8">
              <div className="text-xs font-extrabold text-navy mb-2">📅 Event details</div>
              <div className="text-sm text-gray space-y-1">
                {post.eventDate && (
                  <div>
                    Date: <strong className="text-navy">{fmtDate(post.eventDate)}</strong>
                    {post.eventTime ? ` · ${post.eventTime}` : ""}
                  </div>
                )}
                {post.eventLocation && (
                  <div>
                    Venue: <strong className="text-navy">{post.eventLocation}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {post.body && (
            <div className="text-sm sm:text-[15px] text-navy/90 leading-relaxed space-y-4 mb-8">
              {post.body.split(/\n{2,}/).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          )}

          {detailEntries.length > 0 && (
            <div className="bg-white border border-border rounded-xl p-5 mb-8">
              <div className="text-xs font-extrabold text-navy mb-3">Details</div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {detailEntries.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 text-xs border-b border-border/60 pb-1.5">
                    <dt className="text-gray font-semibold">{prettyKey(k)}</dt>
                    <dd className="text-navy font-bold text-right">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {(post.contactPhone || post.contactEmail) && (
            <div className="bg-white border border-border rounded-xl p-5 mb-8">
              <div className="text-xs font-extrabold text-navy mb-3">Contact the poster</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {post.contactPhone && (
                  <a
                    href={`tel:${post.contactPhone}`}
                    className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-blue transition-colors"
                  >
                    📞 {post.contactPhone}
                  </a>
                )}
                {post.contactEmail && (
                  <a
                    href={`mailto:${post.contactEmail}`}
                    className="px-4 py-2 rounded-xl bg-white border border-border text-navy text-xs font-bold hover:border-navy transition-colors"
                  >
                    ✉️ Email
                  </a>
                )}
              </div>
              {msgState === "done" ? (
                <div className="text-xs font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2.5">
                  Message sent — the poster will get back to you.
                </div>
              ) : (
                <form onSubmit={(e) => void onContact(e)} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={msgName}
                      onChange={(e) => setMsgName(e.target.value)}
                      placeholder="Your name"
                      className="px-3 py-2 rounded-xl bg-light border border-border text-xs text-navy placeholder:text-gray/60 focus:outline-none focus:border-navy"
                    />
                    <input
                      value={msgPhone}
                      onChange={(e) => setMsgPhone(e.target.value)}
                      placeholder="Your phone"
                      className="px-3 py-2 rounded-xl bg-light border border-border text-xs text-navy placeholder:text-gray/60 focus:outline-none focus:border-navy"
                    />
                  </div>
                  <textarea
                    value={msgBody}
                    onChange={(e) => setMsgBody(e.target.value)}
                    placeholder="Write your message…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-light border border-border text-xs text-navy placeholder:text-gray/60 focus:outline-none focus:border-navy"
                  />
                  {msgState === "error" && (
                    <div className="text-[11px] font-bold text-red-700">{msgError}</div>
                  )}
                  <button
                    type="submit"
                    disabled={msgState === "sending" || !msgBody.trim()}
                    className="px-4 py-2 rounded-xl bg-amber text-navy text-xs font-bold hover:bg-amber/90 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {msgState === "sending" ? "Sending…" : "Send message"}
                  </button>
                </form>
              )}
            </div>
          )}

          {claimable && claimHref && (
            <div className="bg-amber/10 border border-amber/30 rounded-xl p-5 mb-8">
              <div className="text-xs font-extrabold text-navy mb-1">
                Is this your listing?
              </div>
              <p className="text-xs text-gray leading-relaxed mb-3">
                This property was spotted on a public marketplace and posted here unclaimed
                so Klagon finds it first. If you are the agent or owner, claim it free —
                we verify on WhatsApp and hand the listing over to you.
              </p>
              <a
                href={claimHref}
                target="_blank"
                rel="noreferrer"
                className="inline-block px-4 py-2 rounded-xl bg-amber text-navy text-xs font-bold hover:bg-amber/90 transition-colors"
              >
                Claim this listing on WhatsApp
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="text-[11px] font-bold text-gray mr-1">Share:</span>            <a
              href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white border border-border text-[11px] font-bold text-navy hover:border-navy transition-colors"
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white border border-border text-[11px] font-bold text-navy hover:border-navy transition-colors"
            >
              Facebook
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white border border-border text-[11px] font-bold text-navy hover:border-navy transition-colors"
            >
              X
            </a>
            <button
              onClick={() => void onCopy()}
              className="px-3 py-1.5 rounded-lg bg-white border border-border text-[11px] font-bold text-navy hover:border-navy transition-colors cursor-pointer"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>

          <div className="border-t border-border pt-4">
            {!user ? (
              <Link href="/auth/login" className="text-[11px] font-bold text-blue hover:underline">
                Log in to report this post
              </Link>
            ) : reportState === "done" ? (
              <div className="text-[11px] font-bold text-emerald-700">
                Thanks — our moderators will take a look.
              </div>
            ) : (
              <div>
                <button
                  onClick={() => setShowReport((s) => !s)}
                  className="text-[11px] font-bold text-gray hover:text-red-700 transition-colors cursor-pointer"
                >
                  Report this post
                </button>
                {showReport && (
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-border text-[11px] font-semibold text-navy cursor-pointer"
                    >
                      {["Spam", "Scam/fraud", "Inappropriate content", "Wrong category", "Other"].map(
                        (r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        )
                      )}
                    </select>
                    <button
                      onClick={() => void onReport()}
                      disabled={reportState === "sending"}
                      className="px-3 py-1.5 rounded-lg bg-red-700 text-white text-[11px] font-bold hover:bg-red-800 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {reportState === "sending" ? "Sending…" : "Submit report"}
                    </button>
                    {reportState === "error" && (
                      <span className="text-[11px] font-bold text-red-700">
                        Could not submit report.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="bg-white py-12 sm:py-14 px-4 sm:px-6 border-t border-border">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-lg font-extrabold text-navy mb-6">More {POST_TYPE_LABELS[post.type].toLowerCase()}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/news/${r.id}`}
                  className="group bg-light border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber/10 text-amber-800 mb-2">
                    {r.category || POST_TYPE_LABELS[r.type]}
                  </span>
                  <h3 className="text-sm font-bold text-navy leading-snug mb-2 group-hover:text-blue transition-colors line-clamp-2">
                    {r.title}
                  </h3>
                  <div className="text-[10px] text-gray">
                    {fmtDate(r.publishedAt ?? r.createdAt)} · {AREA_LABELS[r.area]}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
