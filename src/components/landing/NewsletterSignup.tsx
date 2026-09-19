"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/lib/posts";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | string>("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setState("Enter a valid email address.");
      return;
    }
    setState("sending");
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
          className="min-w-0 flex-1 rounded-lg bg-white/10 border border-white/15 px-2.5 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-amber"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="px-3 py-1.5 rounded-lg bg-amber text-navy text-xs font-bold cursor-pointer hover:bg-amber/90 disabled:opacity-50 flex-shrink-0"
        >
          {state === "sending" ? "…" : "Join"}
        </button>
      </div>
      {state !== "idle" && state !== "sending" && (
        <p className="text-[11px] text-white/60">{state}</p>
      )}
    </form>
  );
}
