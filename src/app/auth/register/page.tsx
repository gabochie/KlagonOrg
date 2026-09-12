"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { INTERESTS } from "@/lib/constants";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";
import { Eye, EyeOff, Sparkles } from "lucide-react";

const OCCUPATIONS = [
  "Student",
  "Apprentice",
  "Looking for work",
  "Self-employed",
  "Full-time employed",
  "Part-time employed",
  "Trader / Business owner",
  "Homemaker",
];

const generatePassword = (length = 16) => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*()-_=+";
  const all = upper + lower + digits + symbols;
  const random = new Uint32Array(length);
  crypto.getRandomValues(random);
  const chars = [upper, lower, digits, symbols].map(
    (set) => set[random[Math.floor(Math.random() * (random.length - 4))] % set.length]
  );
  for (let i = chars.length; i < length; i++) {
    chars.push(all[random[i] % all.length]);
  }
  return chars.sort(() => Math.random() - 0.5).join("");
};

export default function RegisterPage() {
  const { signUp, configured } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    occupation: "",
    career_goal: "",
  });
  const [interests, setInterests] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const toggleInterest = (i: string) =>
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { full_name, phone, email, password, age, gender, occupation, career_goal } = form;
    if (!full_name || !phone || !email || !password) return;
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (!token) return setError("Please complete the human check before creating your account.");
    setBusy(true);
    const check = await verifyTurnstile(token);
    if (!check.success) {
      setBusy(false);
      return setError(check.error ?? "Human check failed. Please try again.");
    }
    const { error: err } = await signUp({
      email,
      password,
      fullName: full_name,
      phone,
      age: age ? parseInt(age, 10) : null,
      gender: (gender || null) as "male" | "female" | "other" | null,
      occupation: occupation || null,
      interests,
      careerGoal: career_goal || null,
    });
    setBusy(false);
    if (err) return setError(err);
    router.push("/auth/pending");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-light px-4 py-8">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-md w-full shadow-sm">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-navy to-blue flex items-center justify-center text-white text-sm font-extrabold">
            KO
          </div>
          <span className="text-base font-bold text-navy">KlagonOrg</span>
        </Link>
        <h1 className="text-lg font-extrabold text-navy text-center mb-1">Create your account</h1>
        <p className="text-sm text-gray text-center mb-6">Join KlagonOrg — free, always</p>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy">Full name</label>
              <input
                className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
                placeholder="Ama"
                required
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy">Phone</label>
              <input
                className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
                placeholder="0244 000 000"
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-navy">Email</label>
            <input
              type="email"
              className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
              placeholder="ama@email.com"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-navy">Password</label>
              <button
                type="button"
                onClick={() => {
                  const pw = generatePassword();
                  setForm((f) => ({ ...f, password: pw }));
                  setShowPassword(true);
                }}
                className="flex items-center gap-1 text-[10px] font-bold text-blue hover:underline cursor-pointer"
              >
                <Sparkles size="11" /> Generate
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
                placeholder="At least 8 characters"
                required
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray pointer-events-auto cursor-pointer"
              >
                {showPassword ? <EyeOff size="16" /> : <Eye size="16" />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy">Age</label>
              <input
                type="number"
                min={5}
                max={120}
                className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
                placeholder="18"
                value={form.age}
                onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy">Gender</label>
              <select
                className="px-3 py-2 rounded-lg border border-border text-sm text-navy font-sans bg-white focus:outline-2 focus:outline-amber focus:border-transparent"
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy">Occupation</label>
              <input
                list="occupations"
                className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
                placeholder="Tap a suggestion or type yours"
                value={form.occupation}
                onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
              />
              <datalist id="occupations">
                {OCCUPATIONS.map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-navy">Interests</label>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleInterest(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer font-sans transition-colors ${
                    interests.includes(i)
                      ? "bg-navy text-white"
                      : "bg-light text-gray border border-border hover:border-navy"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-navy">Career goal (optional)</label>
            <input
              className="px-3 py-2 rounded-lg border border-border text-sm font-sans focus:outline-2 focus:outline-amber focus:border-transparent"
              placeholder="e.g. Become a software engineer"
              value={form.career_goal}
              onChange={(e) => setForm((f) => ({ ...f, career_goal: e.target.value }))}
            />
          </div>
          {error && <p className="text-xs text-red font-semibold">{error}</p>}
          {!configured && (
            <p className="text-xs text-amber font-semibold">
              Account creation will activate once the database is connected.
            </p>
          )}
          <Turnstile onToken={setToken} />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-navy text-white text-sm font-bold cursor-pointer hover:bg-blue transition-colors font-sans disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {busy ? "Creating account…" : "Create Account"}
          </button>
        </form>
        <p className="text-center text-xs text-gray mt-4">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}