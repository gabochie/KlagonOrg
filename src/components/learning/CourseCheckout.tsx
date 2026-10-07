"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button, Input, ConsentBox } from "@/components/ui";
import { recordContactConsent, type MarketingChannel } from "@/lib/consent";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";
import { chargeCourse, confirmCourse, fetchCourseStatus } from "@/lib/coursePayments";
import { recordLeadEvent } from "@/lib/analytics";
import type { MoMoNetwork } from "@/lib/payments";
import { useAuth } from "@/components/auth/AuthProvider";
import { Lock, ShieldCheck } from "lucide-react";

const NETWORKS: MoMoNetwork[] = ["mtn", "telecel", "at"];

function networkLabel(n: MoMoNetwork) {
  return n === "at" ? "AT" : n.charAt(0).toUpperCase() + n.slice(1);
}

/** A MoMo number is the only contact field on this payment form. */
const CONSENT_CHANNELS: readonly MarketingChannel[] = ["sms", "whatsapp"];

/**
 * Buys lifetime access to a single course with a real Mobile Money charge.
 *
 * The browser only ever names the course; the Worker derives the fee from the
 * database (course_quote) and the entitlement is granted from the Moolre
 * callback. Sign-in is required so access is always attached to a real account.
 */

export function CourseCheckout({
  course,
  onUnlocked,
}: {
  course: { id: string; title: string; price_ghs: number };
  onUnlocked?: () => void;
}) {
  const { session, loading } = useAuth();
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
  const [awaiting, setAwaiting] = useState(false);
  const [done, setDone] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, []);

  function pollUntilSettled(ref: string) {
    setAwaiting(true);
    let tries = 0;
    pollRef.current = window.setInterval(async () => {
      tries += 1;
      const status = await fetchCourseStatus(ref);
      if (status.settled || status.provider === "paid") {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        setAwaiting(false);
        setDone(true);
        recordLeadEvent({
          source: "course-checkout",
          action: "paid",
          metadata: { course_id: course.id, amount_ghs: course.price_ghs },
        });
        onUnlocked?.();
        return;
      }
      if (status.provider === "failed") {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        setAwaiting(false);
        setError("That payment did not go through. Please try again.");
        recordLeadEvent({
          source: "course-checkout",
          action: "failed",
          metadata: { course_id: course.id },
        });
        return;
      }
      if (tries >= 20) {
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
        setAwaiting(false);
      }
    }, 3000);
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
        form_source: "course-checkout",
      });
    }
    const result = await chargeCourse({
      course_id: course.id,
      phone: phone.trim(),
      network,
      accessToken: session?.access_token ?? "",
    });
    setSending(false);
    if (!result.ok) {
      recordLeadEvent({
        source: "course-checkout",
        action: "charge-failed",
        metadata: { course_id: course.id, code: result.code ?? null },
      });
      const detail = result.code
        ? `${result.error ?? "Payment request failed."} (${result.code})`
        : (result.error ?? "Payment request failed. Please try again.");
      return setError(detail);
    }
    recordLeadEvent({
      source: "course-checkout",
      action: "charge-start",
      metadata: { course_id: course.id, amount_ghs: course.price_ghs },
    });
    setPromptPhone(result.payer ?? phone.trim());
    if (result.otp_required && result.ref) {
      setChargeRef(result.ref);
      setOtp("");
      recordLeadEvent({
        source: "course-checkout",
        action: "otp-shown",
        metadata: { course_id: course.id },
      });
      return;
    }
    if (result.ref) pollUntilSettled(result.ref);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!chargeRef) return;
    setError(null);
    setVerifying(true);
    const result = await confirmCourse({ ref: chargeRef, otp, phone: phone.trim(), network });
    setVerifying(false);
    if (!result.ok) {
      const detail = result.code
        ? `${result.error ?? "Verification failed."} (${result.code})`
        : (result.error ?? "Verification failed. Check the code and try again.");
      return setError(detail);
    }
    const ref = result.ref ?? chargeRef;
    setChargeRef(null);
    pollUntilSettled(ref);
  }

  if (loading) {
    return <div className="mt-4 text-xs text-gray">Checking your account…</div>;
  }

  if (!session) {
    return (
      <div className="mt-4 rounded-xl border border-blue/20 bg-blue/5 px-4 py-4">
        <div className="text-sm font-extrabold text-navy mb-1">Sign in to unlock this course</div>
        <p className="text-xs text-gray mb-3">
          Purchases are tied to your free account so your lifetime access can never be lost.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-xs font-bold text-white hover:bg-blue transition-colors"
          >
            Create free account →
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3.5 py-2 text-xs font-bold text-navy hover:border-navy transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
        Payment received — your lifetime access is unlocked. Loading the lessons…
      </div>
    );
  }

  if (awaiting) {
    return (
      <div className="mt-4 rounded-xl border border-amber/40 bg-amber/5 px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-extrabold text-navy">
          <ShieldCheck size={16} className="text-amber-strong" /> Waiting for MoMo approval…
        </div>
        <p className="text-xs text-gray mt-1">
          Approve the prompt on your phone{phone ? ` (${phone})` : ""}. This page updates automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-amber bg-amber/5 p-4">
      {chargeRef ? (
        <form onSubmit={verify}>
          <div className="text-sm font-extrabold text-navy">Enter the MoMo code</div>
          <p className="text-xs text-gray mt-1">
            We sent a code to <span className="font-bold">{promptPhone}</span>. Enter it to approve GH₵{" "}
            {course.price_ghs}.
          </p>
          <div className="mt-2.5">
            <Input
              id="course-otp"
              label="OTP code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>
          {error && <p className="text-xs text-red-700 mt-1.5">{error}</p>}
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
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <form onSubmit={start}>
          <div className="text-sm font-extrabold text-navy">
            Unlock this course — GH₵ {course.price_ghs} (one-time, lifetime access)
          </div>
          <p className="text-xs text-gray mt-1">
            Pay with Mobile Money. Access is unlocked for good as soon as payment clears.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5">
            <Input
              id="course-phone"
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
                    {networkLabel(n)}
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
            formSource="course-checkout"
          />
          <Turnstile onToken={setToken} />
          </div>
          {error && <p className="text-xs text-red-700 mt-1.5">{error}</p>}
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <Button size="sm" variant="dark" type="submit" disabled={sending}>
              {sending ? "Starting…" : `Pay GH₵ ${course.price_ghs}`}
            </Button>
            <div className="flex items-center justify-center gap-1 text-[11px] text-gray">
              <Lock size={11} /> Secure MoMo payment
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
