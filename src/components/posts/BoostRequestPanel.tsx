"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button, Input, ConsentBox } from "@/components/ui";
import { recordContactConsent, type MarketingChannel } from "@/lib/consent";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";
import { chargeBoost, confirmBoost } from "@/lib/boostPayments";
import type { MoMoNetwork } from "@/lib/payments";
import { boostPriceFor } from "@/lib/posts";
import { isBoostActive } from "@/lib/boosts";
import { ORG_WA, waLink } from "@/lib/wa";
import type { Post } from "@/types";

const NETWORKS: MoMoNetwork[] = ["mtn", "telecel", "at"];

/** A MoMo number is the only contact field on this payment form. */
const CONSENT_CHANNELS: readonly MarketingChannel[] = ["sms", "whatsapp"];

/**
 * Lets a listing owner feature their post with a real Mobile Money charge.
 *
 * The browser only ever names the listing; the Worker derives the fee from the
 * database (boost_quote) and applies the boost from the Moolre callback. So the
 * placement is never granted by anything the client says — a blocked or tampered
 * page can request a charge but cannot grant itself a feature.
 */

export function BoostRequestPanel({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<MoMoNetwork>("mtn");
  const [token, setToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chargeRef, setChargeRef] = useState<string | null>(null);
  const [promptPhone, setPromptPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!phone.trim()) return setError("Enter the MoMo number to charge.");
    if (!token) return setError("Please complete the human check first.");
    setSending(true);
    const human = await verifyTurnstile(token);
    if (!human.success) {
      setSending(false);
      return setError(human.error ?? "Human check failed.");
    }
        // Optional: paying must not depend on accepting marketing, and the payment
    // prompts that follow are transactional messages, not marketing.
    if (consent) {
      await recordContactConsent({
        phone,
        channels: CONSENT_CHANNELS,
        granted: true,
        form_source: "boost-checkout",
      });
    }
    const result = await chargeBoost({ post_id: post.id, phone: phone.trim(), network });
    setSending(false);
    if (!result.ok) {
      const detail = result.code
        ? `${result.error ?? "Payment request failed."} (${result.code})`
        : (result.error ?? "Payment request failed. Please try again.");
      return setError(detail);
    }
    setPromptPhone(result.payer ?? phone.trim());
    if (result.otp_required && result.ref) {
      setChargeRef(result.ref);
      setOtp("");
      return;
    }
    setSubmitted(true);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!chargeRef) return;
    setError(null);
    setVerifying(true);
    const result = await confirmBoost({ ref: chargeRef, otp, phone: phone.trim(), network });
    setVerifying(false);
    if (!result.ok) {
      const detail = result.code
        ? `${result.error ?? "Verification failed."} (${result.code})`
        : (result.error ?? "Verification failed. Check the code and try again.");
      return setError(detail);
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mt-2 text-xs font-bold text-emerald-700">
        Payment received — we&apos;ll feature this listing for {price.days} days as soon as MoMo confirms.
      </div>
    );
  }

  return (
    <div className="mt-2.5">
      {chargeRef ? (
        <form onSubmit={verify} className="rounded-xl border border-amber bg-amber/5 p-3">
          <div className="text-sm font-extrabold text-navy">Enter the MoMo code</div>
          <p className="text-xs text-gray mt-1">
            We sent a code to <span className="font-bold">{promptPhone}</span>. Enter it to approve GH₵{" "}
            {price.feeGhs}.
          </p>
          <div className="mt-2.5">
            <Input
              id="boost-otp"
              label="OTP code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>
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
            <Button size="sm" variant="dark" type="submit" disabled={verifying}>
              {verifying ? "Verifying…" : "Confirm payment"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => {
                setChargeRef(null);
                setOpen(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : open ? (
        <form onSubmit={start} className="rounded-xl border border-amber bg-amber/5 p-3">
          <div className="text-sm font-extrabold text-navy">
            Feature this listing for {price.days} days — GH₵ {price.feeGhs}
          </div>
          <p className="text-xs text-gray mt-1">
            Pay with Mobile Money. Featured listings sit above the rest in their section and carry a Featured
            mark — it goes live once payment clears.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5">
            <Input
              id="boost-phone"
              label="MoMo phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0244 000 000"
              inputMode="tel"
            />
            <div>
              <div className="text-xs font-bold text-navy mb-2">Network</div>
              <div className="flex gap-2">
                {NETWORKS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNetwork(n)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                      network === n
                        ? "bg-navy text-white border-navy"
                        : "bg-white text-navy border-navy/15 hover:border-navy/30"
                    }`}
                  >
                    {n === "at" ? "AT" : n.charAt(0).toUpperCase() + n.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-2.5">
            <ConsentBox
            checked={consent}
            onChange={setConsent}
            channels={CONSENT_CHANNELS}
            purpose="news, program updates and invitations"
            formSource="boost-checkout"
          />
          <Turnstile onToken={setToken} />
          </div>
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
            <Button size="sm" variant="dark" type="submit" disabled={sending}>
              {sending ? "Starting…" : `Pay GH₵ ${price.feeGhs}`}
            </Button>
            <Button size="sm" variant="secondary" type="button" onClick={() => setOpen(false)}>
              Not now
            </Button>
          </div>
        </form>
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
