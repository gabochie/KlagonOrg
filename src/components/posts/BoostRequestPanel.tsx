"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui";
import { boostPriceFor } from "@/lib/posts";
import { notifyTeam } from "@/lib/notify";
import { isBoostActive } from "@/lib/boosts";
import { getBrowserClient, isSupabaseConfigured } from "@/lib/supabase-browser";
import { ORG_WA, waLink } from "@/lib/wa";
import type { Post } from "@/types";

/**
 * Lets a listing owner ask to be featured, without pretending there is a
 * checkout.
 *
 * KLAGON has no card/QR payment rail wired for boosts yet, so this deliberately
 * stops at "we have your request": it records the enquiry at the real,
 * server-defined price and tells the team to confirm by WhatsApp. The boost
 * itself is applied by staff after payment clears, never from the browser.
 *
 * The price shown is the same one the database charges (see BOOST_PRICING and
 * the purchase_boost RPC), so nobody is quoted one number and charged another.
 *
 * Unlike the fire-and-forget telemetry helpers, this write is checked. A boost
 * request is a promise that a human will call you back, so it must not report
 * success unless the request genuinely landed; otherwise a Supabase outage
 * would show "we'll be in touch" to someone who was never recorded.
 */
export function BoostRequestPanel({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const price = boostPriceFor(post.type, post.category);
  const active = isBoostActive(post);

  // A boost only affects a live listing, so there is nothing to buy yet.
  if (post.status !== "approved") {
    return null;
  }

  // Already featured: say so before offering to sell the same thing again.
  if (active) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-amber-strong">
        <Zap size={12} /> Featured until {new Date(post.boostUntil!).toLocaleDateString()}
      </div>
    );
  }

  // Nothing can be recorded, so do not offer a button that cannot deliver.
  if (!isSupabaseConfigured()) {
    return (
      <a
        href={waLink(ORG_WA, `Hello, I would like to feature my KLAGON listing "${post.title}".`)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 inline-flex min-h-11 items-center gap-1 px-3 py-1.5 rounded-lg border border-amber text-amber-strong text-xs font-bold hover:bg-amber/10 transition-colors"
      >
        <Zap size={11} /> Feature this listing
      </a>
    );
  }

  async function request() {
    setSending(true);
    setError(null);
    const client = getBrowserClient();
    if (!client) {
      setError("Could not reach KLAGON right now. Please message us on WhatsApp instead.");
      setSending(false);
      return;
    }
    const { error: insertError } = await client.from("lead_events").insert({
      // Attribute the request to its owner. Without this the row is orphaned:
      // lead_events_select_own_or_admin only matches member_id = auth.uid(), so
      // the member could not even see their own request, let alone staff
      // reconcile it. This panel only ever renders on the viewer's own posts,
      // so the post's submitter is the signed-in user.
      member_id: post.submittedBy,
      source: "boost-request",
      action: "submit",
      page: typeof window !== "undefined" ? window.location.pathname.slice(0, 160) : null,
      metadata: {
        post_id: post.id,
        post_type: post.type,
        category: post.category ?? "",
        title: post.title,
        tier: price.tier,
        fee_ghs: price.feeGhs,
        days: price.days,
      },
    });
    if (insertError) {
      setError("We could not save that request. Please message us on WhatsApp instead.");
      setSending(false);
      return;
    }
    // Fire-and-forget: the request is safely recorded, so a notification
    // outage must not stop the owner seeing their confirmation.
    void notifyTeam("contact", {
      "Enquiry type": "Boost request",
      Listing: post.title,
      "Listing type": post.type,
      Category: post.category ?? "-",
      "Boost tier": price.tier,
      Price: `GH₵ ${price.feeGhs} for ${price.days} days`,
      "Listing link": `https://klagon.org/news/${post.id}`,
    });
    setSent(true);
    setOpen(false);
    setSending(false);
  }

  if (sent) {
    return (
      <div className="mt-2 text-xs font-bold text-emerald-700">
        Request received — we&apos;ll confirm and send payment details on WhatsApp.
      </div>
    );
  }

  return (
    <div className="mt-2.5">
      {open ? (
        <div className="rounded-xl border border-amber bg-amber/5 p-3">
          <div className="text-sm font-extrabold text-navy">
            Feature this listing for {price.days} days — GH₵ {price.feeGhs}
          </div>
          <p className="text-xs text-gray mt-1">
            Featured listings sit above the rest in their section and carry a Featured mark. Send the request
            and we&apos;ll confirm the details and payment on WhatsApp — it goes live once payment clears.
          </p>
          {error && (
            <p className="text-xs text-red-700 mt-1.5">
              {error}{" "}
              <a
                href={waLink(ORG_WA, `Hello, I would like to feature my KLAGON listing "${post.title}".`)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold"
              >
                Message us on WhatsApp
              </a>
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <Button
              size="sm"
              variant="dark"
              disabled={sending}
              onClick={() => void request()}
            >
              {sending ? "Sending…" : "Request this boost"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>
              Not now
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="min-h-11 px-3 py-1.5 rounded-lg border border-amber text-amber-strong text-xs font-bold hover:bg-amber/10 transition-colors cursor-pointer inline-flex items-center gap-1"
        >
          <Zap size={11} /> Feature this listing
        </button>
      )}
    </div>
  );
}
