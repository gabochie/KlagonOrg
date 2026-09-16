"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const { signIn, signOut, user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user && isAdmin) router.replace("/dashboard/admin");
  }, [loading, user, isAdmin, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailValue = email.trim();
    if (!emailValue) return setError("Admin email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue))
      return setError("Enter a valid email address.");
    if (!password) return setError("Admin password is required.");
    setError(null);
    setBusy(true);
    const { error: err, profile: signedProfile } = await signIn(email, password);
    if (err) {
      setBusy(false);
      return setError(err);
    }
    const role = signedProfile?.role;
    if (role !== "admin" && role !== "super_admin") {
      await signOut();
      setEmail("");
      setPassword("");
      setBusy(false);
      return setError(
        "This account is not an administrator. Admin access requires the admin role — if you're a member, use the member portal instead.",
      );
    }
    router.replace("/dashboard/admin");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink via-navy to-ink px-4 py-10">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber/80 hover:text-amber transition-colors mb-6"
        >
          <ArrowLeft size="14" /> Back to klagon.org
        </Link>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden ring-1 ring-white/10">
          <div className="bg-gradient-to-r from-navy to-blue px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber flex items-center justify-center text-navy shrink-0">
              <ShieldCheck size="22" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest uppercase text-amber">Restricted area</div>
              <h1 className="text-base font-extrabold text-white leading-tight">
                Command Center — Admin Access
              </h1>
            </div>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-gray mb-5">
              Sign in with an administrator account to manage KlagonOrg operations.
            </p>
            {user && !isAdmin && (
              <div className="mb-4 rounded-lg border border-amber/40 bg-amber/10 px-3.5 py-2.5 text-xs text-amber-strong font-semibold">
                Signed in as {user.email} (member account). Use an admin account to
                proceed — or sign out below.
              </div>
            )}
            <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-navy">Admin email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@klagon.org"
                  autoComplete="username"
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
                    autoComplete="current-password"
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
              {error && <p className="text-xs text-red font-semibold">{error}</p>}
              {loading && (
                <p className="text-xs text-gray font-semibold">
                  Auth settings still loading — you can try again in a moment.
                </p>
              )}
              <button
                type="submit"
                disabled={busy || loading}
                className="w-full py-2.5 rounded-lg bg-amber text-navy text-sm font-extrabold cursor-pointer hover:bg-amber-strong hover:text-white transition-colors font-sans disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {busy ? "Verifying access…" : "Sign in as Admin"}
              </button>
            </form>
            <div className="mt-5 flex flex-col items-center gap-2">
              {user && !isAdmin && (
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="text-xs text-gray font-bold hover:text-red transition-colors cursor-pointer"
                >
                  Sign out of member account
                </button>
              )}
              <Link
                href="/auth/login"
                className="text-xs text-gray font-semibold hover:text-navy transition-colors"
              >
                Are you a member? Use the member portal
              </Link>
            </div>
          </div>
          <div className="px-6 py-3.5 border-t border-border bg-light">
            <p className="text-[11px] text-gray/80">
              🔒 Authorized administrators only. Access is restricted by the admin role and
              protected by database security policies.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}