"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getBrowserClient } from "@/lib/supabase-browser";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";
import { Mail, ArrowRight, Sparkles, Lock, CheckCircle } from "lucide-react";

export function LeadMagnet({
  title = "Unlock the full course",
  subtitle = "Sign in to unlock every lesson, earn XP, and track your progress.",
  ctaLabel = "Unlock the course",
}: {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
}) {
  const { profile } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const client = useMemo(() => getBrowserClient(), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!turnstileToken) {
      setError("Please complete the verification check first.");
      return;
    }
    setBusy(true);
    setError(null     );

    const human = await verifyTurnstile(turnstileToken);
    if (!human) {
      setBusy(false);
      setError("Verification failed. Please try again.");
      return;
    }

    if (client) {
      const { error: dbErr } = await client.from("lead_captures").insert({
        name: name.trim() || null,
        email: email.trim().toLowerCase(),
        source: "learning-gate",
        profile_id: profile?.id ?? null,
      });
      if (dbErr) setError(dbErr.message);
    }
    setBusy(false);

    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-amber/30 bg-amber/10 px-6 py-6 text-center">
        <CheckCircle size={28} className="text-green-600" />
        <div className="text-sm font-extrabold text-navy">You're all set!</div>
        <div className="text-xs text-gray">The full course is now unlocked. Keep learning and earn XP.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber/30 bg-gradient-to-br from-amber/10 to-teal/5 p-6">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-amber">
        <Sparkles size={12} /> Free Preview
      </div>
      <h3 className="mb-1 flex items-center gap-2 text-base font-extrabold text-navy">
        <Lock size={16} className="text-amber" /> {title}
      </h3>
      <p className="mb-4 text-xs text-gray">{subtitle}</p>

      <form onSubmit={(e) => void submit(e)} className="space-y-2.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-gray/60 focus:border-amber focus:outline-none"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-gray/60 focus:border-amber focus:outline-none"
        />
        <Turnstile onToken={setTurnstileToken} />
        {error && (
          <div className="text-xs font-semibold text-red-600">{error}</div>
        )}
        <button
          type="submit"
          disabled={busy || !turnstileToken}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white hover:bg-blue disabled:opacity-50 transition-colors"
        >
          {busy ? "Unlocking…" : ctaLabel} <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
}
