"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function LoginPage() {
  const { signIn, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await signIn(email, password);
    setBusy(false);
    if (err) return setError(err);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light px-4">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-sm w-full shadow-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy to-blue flex items-center justify-center text-white text-sm font-extrabold">
            KS
          </div>
          <span className="text-base font-bold text-navy">KlagonStudios</span>
        </Link>
        <h1 className="text-lg font-extrabold text-navy text-center mb-1">Welcome back</h1>
        <p className="text-sm text-gray text-center mb-6">Sign in to your KlagonStudios account</p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-navy">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ama@email.com"
              className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-navy">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
            />
          </div>
          {error && <p className="text-xs text-red font-semibold">{error}</p>}
          {loading && (
            <p className="text-xs text-gray font-semibold">
              Auth settings still loading — you can try again in a moment.
            </p>
          )}
          <button
            type="submit"
            disabled={busy || loading}
            className="w-full py-2.5 rounded-lg bg-navy text-white text-sm font-bold cursor-pointer hover:bg-blue transition-colors font-sans disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-center text-xs text-gray mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="text-blue font-bold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}