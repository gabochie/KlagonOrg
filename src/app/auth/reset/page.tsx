"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { CheckCircle2, KeyRound, RotateCcw } from "lucide-react";

export default function ResetPasswordPage() {
  const { user, loading, changePassword, signOut } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => {
        void signOut();
        router.push("/auth/login");
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [done, router, signOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords don't match.");
    setError(null);
    setBusy(true);
    const { error: err } = await changePassword(password);
    setBusy(false);
    if (err) return setError(err);
    setDone(true);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-light px-4">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-sm w-full shadow-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy to-blue flex items-center justify-center text-white text-xs font-extrabold">
            KO
          </div>
          <span className="text-sm font-extrabold text-navy">KLAGON.org</span>
        </Link>

        {loading ? (
          <p className="text-center text-xs text-gray font-semibold py-6">Checking reset link…</p>
        ) : done ? (
          <div className="text-center pt-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
              <CheckCircle2 size="22" className="text-green-600" />
            </div>
            <h1 className="text-base font-extrabold text-navy mb-1">Password updated</h1>
            <p className="text-xs text-gray">Taking you to sign in…</p>
          </div>
        ) : !user ? (
          <div className="text-center pt-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber/15 mb-3">
              <RotateCcw size="20" className="text-amber-strong" />
            </div>
            <h1 className="text-base font-extrabold text-navy mb-1">Link invalid or expired</h1>
            <p className="text-sm text-gray leading-relaxed mb-4">
              This password reset link can&apos;t be used. Request a fresh one and try again.
            </p>
            <Link
              href="/auth/forgot"
              className="inline-block px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
            >
              Get a new link
            </Link>
          </div>
        ) : (
          <form className="flex flex-col gap-4" noValidate onSubmit={(e) => void handleSubmit(e)}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <KeyRound size="17" className="text-amber-strong" />
              <h1 className="text-base font-extrabold text-navy">Choose a new password</h1>
            </div>
            <p className="text-xs text-gray -mt-2">
              For account <span className="font-bold text-navy">{user.email}</span>
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy">New password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy">Confirm new password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
              />
            </div>
            {error && <p className="text-xs text-red font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-navy text-white text-sm font-bold hover:bg-blue transition-colors font-sans disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Updating…" : "Set new password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}