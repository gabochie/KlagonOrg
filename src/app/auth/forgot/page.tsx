"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const { sendPasswordReset, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValue = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue))
      return setError("Enter a valid email address.");
    setError(null);
    setBusy(true);
    const { error: err } = await sendPasswordReset(emailValue);
    setBusy(false);
    if (err) return setError(err);
    setSent(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-light px-4">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-sm w-full shadow-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy to-blue flex items-center justify-center text-white text-xs font-extrabold">
            KO
          </div>
          <span className="text-sm font-extrabold text-navy">KlagonOrg</span>
        </Link>
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <KeyRound size="17" className="text-amber-strong" />
          <h1 className="text-base font-extrabold text-navy">Reset password</h1>
        </div>
        {sent ? (
          <div className="text-center pt-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
              <MailCheck size="22" className="text-green-600" />
            </div>
            <p className="text-sm text-gray leading-relaxed mb-4">
              If an account exists for <span className="font-bold text-navy">{email.trim()}</span>,
              a reset link is on its way. Check your inbox (and spam folder).
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-xs text-blue font-bold hover:underline cursor-pointer"
            >
              Send to a different email
            </button>
          </div>
        ) : (
          <form className="mt-3 flex flex-col gap-4" noValidate onSubmit={(e) => void handleSubmit(e)}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy">Account email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
              />
            </div>
            {error && <p className="text-xs text-red font-semibold">{error}</p>}
            {!configured && (
              <p className="text-xs text-gray font-semibold">
                Email sending is not set up yet — add Supabase keys in .env.local
              </p>
            )}
            <button
              type="submit"
              disabled={busy || !configured}
              className="w-full py-2.5 rounded-lg bg-navy text-white text-sm font-bold hover:bg-blue transition-colors font-sans disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}
        <p className="text-center text-xs text-gray mt-4">
          Remembered it?{" "}
          <Link href="/auth/login" className="text-blue font-bold hover:underline">
            Sign in
          </Link>{" "}
          ·{" "}
          <Link href="/admin/login" className="text-amber-strong font-bold hover:underline">
            Admin
          </Link>
        </p>
        <Link href="/" className="inline-flex items-center gap-1 justify-center w-full text-[11px] text-gray/70 font-semibold hover:text-navy mt-3">
          <ArrowLeft size="12" /> Back to klagon.org
        </Link>
      </div>
    </main>
  );
}