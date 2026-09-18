"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  fetchSponsorReviews,
  markReviewHelpful,
  submitSponsorReview,
  type Review,
} from "@/lib/reviews";

function Stars({ value }: { value: number }) {
  return (
    <span className="text-amber-strong" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i}>{i < Math.round(value) ? "★" : "☆"}</span>
      ))}
    </span>
  );
}

export function ReviewsSection({ sponsorId }: { sponsorId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [voted, setVoted] = useState<Set<string>>(new Set());

  useEffect(() => {
    void (async () => {
      setReviews(await fetchSponsorReviews(sponsorId));
      setLoading(false);
    })();
  }, [sponsorId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    setSending(true);
    const res = await submitSponsorReview({
      sponsorId,
      reviewerName: name || user?.email?.split("@")[0] || "Visitor",
      rating,
      title,
      body,
    });
    setSending(false);
    if (!res.ok) {
      setNotice(res.error ?? "Could not submit.");
      return;
    }
    setNotice("Thanks — your review is awaiting moderation.");
    setName("");
    setTitle("");
    setBody("");
    setRating(5);
  }

  async function helpful(id: string) {
    if (voted.has(id)) return;
    setVoted(new Set(voted).add(id));
    const ok = await markReviewHelpful(id);
    if (ok) {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, helpful: r.helpful + 1 } : r)));
    }
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-5 sm:p-6">
      <h2 className="text-lg font-extrabold text-navy mb-1">Reviews</h2>
      <p className="text-xs text-gray mb-4">
        Written by visitors and our team. Every review is moderated before it appears.
      </p>

      {loading ? (
        <div className="text-sm text-gray py-4">Loading reviews…</div>
      ) : reviews.length === 0 ? (
        <div className="text-sm text-gray py-4">
          No reviews yet — be the first to share your stay.
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-6">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-pale pb-4 last:border-0 last:pb-0">
              <div className="flex items-center justify-between gap-2">
                <Stars value={r.rating} />
                {r.staffPick && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber/20 text-amber-800 uppercase tracking-wider">
                    Team verified
                  </span>
                )}
              </div>
              {r.title && <div className="text-sm font-bold text-navy mt-1">{r.title}</div>}
              {r.body && <p className="text-sm text-gray leading-relaxed mt-1">{r.body}</p>}
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-gray">
                  {r.reviewerName} ·{" "}
                  {new Date(r.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={() => void helpful(r.id)}
                  disabled={voted.has(r.id)}
                  className="text-[11px] font-bold text-navy cursor-pointer disabled:opacity-50"
                >
                  Helpful ({r.helpful})
                </button>
              </div>
              {r.reply && (
                <div className="mt-2 ml-3 pl-3 border-l-2 border-amber text-xs text-gray">
                  <span className="font-bold text-navy">Response from the host: </span>
                  {r.reply}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="border-t border-border pt-4 flex flex-col gap-2">
        <div className="text-sm font-bold text-navy">Write a review</div>
        {!user && (
          <p className="text-[11px] text-gray">
            Posting as a visitor.{" "}
            <Link href="/auth/login" className="font-bold text-navy underline">
              Log in
            </Link>{" "}
            to post under your name.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={user?.email?.split("@")[0] ?? "Jane Mensah"}
          />
          <label className="text-xs font-bold text-navy">
            Rating
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Input
          label="Headline (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Clean rooms, close to the beach road"
        />
        <label className="text-xs font-bold text-navy">
          Your review
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="What should the next guest know?"
            className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
          />
        </label>
        {notice && <div className="text-xs font-semibold text-navy">{notice}</div>}
        <Button variant="primary" disabled={sending}>
          {sending ? "Submitting…" : "Submit Review →"}
        </Button>
      </form>
    </div>
  );
}
