"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/lib/posts";
import { recordConsent, type MarketingChannel } from "@/lib/consent";
import { getInvisibleToken, verifyTurnstile } from "@/lib/turnstile";
import { ConsentBox } from "@/components/ui";

/** The footer sends the monthly digest by email only — claim nothing else. */
const CHANNELS: readonly MarketingChannel[] = ["email"];

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done" | string>("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setState("Enter a valid email address.");
      return;
    }
    if (!consent) {
      setState("Please tick the box so we know we may email you.");
      return;
    }
    setState("sending");
    // Invisible human check; fail open so a blocked challenge script
    // never costs a legit subscriber (spam cost here is one DB row).
    try {
      const token = await getInvisibleToken();
      const check = await verifyTurnstile(token);
      if (!check.success) {
        setState("Human check failed. Please try again.");
        return;
      }
    } catch {
      // Fall through and subscribe anyway (see above).
    }

    // Consent first, subscription second, and never the other way round.
    // If this fails we stop: a subscriber row with no permission on file is
    // precisely the state this whole mechanism exists to prevent.
    const consentRes = await recordConsent({
      subject_type: "email",
      subject_value: value,
      channel: "email",
      granted: true,
      form_source: "footer",
    });
    if (consentRes.error) {
      setState("Could not save your consent. Please try again.");
      return;
    }

    const res = await subscribeToNewsletter(value, undefined, "footer");
    setState(res.ok ? "done" : (res.error ?? "Something went wrong."));
  }

  if (state === "done") {
    return (
      <p className="text-xs text-amber font-semibold">
        You&apos;re on the list — one email a month, no spam.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          aria-label="Email address"
          className="min-w-0 flex-1 max-sm:min-h-12 max-sm:text-base rounded-lg bg-white/10 border border-white/15 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-amber px-3 py-1.5 text-xs font-bold text-navy cursor-pointer hover:bg-amber/90 disabled:opacity-50 flex-shrink-0"
        >
          {state === "sending" ? "…" : "Join"}
        </button>
      </div>
      <ConsentBox
        checked={consent}
        onChange={setConsent}
        channels={CHANNELS}
        purpose="a monthly news roundup"
        required
        variant="dark"
        formSource="footer"
      />
      {state !== "idle" && state !== "sending" && (
        <p className="text-[11px] text-white/60">{state}</p>
      )}
    </form>
  );
}
