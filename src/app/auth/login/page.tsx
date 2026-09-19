"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { signIn, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValue = email.trim();
    if (!emailValue) return setError("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue))
      return setError("Enter a valid email address.");
    if (!password) return setError("Password is required.");
    setError(null);
    setBusy(true);
    const { error: err, profile } = await signIn(email, password);
    setBusy(false);
    if (err) return setError(err);
    const role = profile?.role;
    if (role === "admin" || role === "super_admin") return router.push("/dashboard/admin");
    return router.push("/dashboard/member");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-light px-4">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-sm w-full shadow-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy to-blue flex items-center justify-center text-white text-sm font-extrabold">
            KO
          </div>
          <span className="text-base font-bold text-navy">KLAGON.org</span>
        </Link>
        <h1 className="text-lg font-extrabold text-navy text-center mb-1">Welcome back</h1>
        <p className="text-sm text-gray text-center mb-6">Sign in to your KLAGON.org account</p>
        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray cursor-pointer"
              >
                {showPassword ? <EyeOff size="16" /> : <Eye size="16" />}
              </button>
            </div>
          </div>
          <div className="flex justify-end -mt-1">
            <Link
              href="/auth/forgot"
              className="text-[11px] text-gray font-bold hover:text-blue transition-colors"
            >
              Forgot password?
            </Link>
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
        <p className="text-center text-[11px] text-gray/70 mt-3">
          Organizer?{" "}
          <Link href="/admin/login" className="text-amber-strong font-bold hover:underline">
            Admin sign in
          </Link>
        </p>
      </div>
    </main>
  );
}