"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SPONSOR_PLANS } from "@/lib/constants";
import { Button, Input } from "@/components/ui";
import { CheckCircle } from "lucide-react";
import { submitSponsorApplication } from "@/lib/forms";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";

export default function SponsorPage() {
  const [selected, setSelected] = useState("2");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    org_name: "",
  });

  const plan = SPONSOR_PLANS.find((p) => p.id === selected);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) return setError("Please complete the human check before submitting.");
    setSending(true);
    const check = await verifyTurnstile(token);
    if (!check.success) {
      setSending(false);
      return setError(check.error ?? "Human check failed. Please try again.");
    }
    const { error: err } = await submitSponsorApplication({
      ...form,
      org_name: form.org_name || null,
      plan_id: selected || null,
      message: null,
    });
    setSending(false);
    if (err) return setError(err);
    setSubmitted(true);
  };

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Sponsor KlagonOrg
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Partner with Klagon&apos;s future.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Whether you&apos;re a company, diaspora member, NGO, or individual — your sponsorship
            funds workshops, equipment, mentors, and the next generation of Ghanaian innovators.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-2">
            Choose a sponsorship level
          </h2>
          <p className="text-sm text-gray text-center mb-10 max-w-md mx-auto">
            Every level includes recognition and impact reporting. Custom partnerships also available.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {SPONSOR_PLANS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`text-left bg-white rounded-xl border p-6 cursor-pointer font-sans transition-all relative ${
                  p.highlighted
                    ? "border-amber ring-2 ring-amber/20 -mt-2 sm:-mt-4"
                    : "border-border hover:border-amber"
                } ${selected === p.id ? "ring-2 ring-navy" : ""}`}
              >
                {p.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber text-navy text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                    Most Popular
                  </span>
                )}
                <h3 className="text-base font-bold text-navy mb-1 mt-1">{p.name}</h3>
                <div className="text-xl font-extrabold text-navy mb-3">{p.amount}</div>
                <p className="text-xs text-gray leading-relaxed mb-4">{p.description}</p>
                <ul className="flex flex-col gap-2">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-1.5 text-xs text-navy">
                      <CheckCircle size="14" className="text-green flex-shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg font-extrabold text-navy text-center mb-6">
              Get started as a sponsor
            </h2>
            {submitted ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <div className="text-3xl mb-3">🤝</div>
                <h3 className="text-base font-bold text-navy mb-1">Thank you!</h3>
                <p className="text-sm text-gray">Our partnerships team will reach out within 2 business days to finalize details.</p>
              </div>
            ) : (
              <form
                className="bg-white rounded-xl border border-border p-6 sm:p-8 flex flex-col gap-4"
                onSubmit={handleSubmit}
              >
                {plan && (
                  <div className="bg-pale rounded-lg p-3 text-center mb-2">
                    <span className="text-xs text-gray">Selected plan: </span>
                    <span className="text-sm font-bold text-navy">{plan.name} — {plan.amount}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Full name / Org name" placeholder="Your name" required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
                  <Input label="Phone" placeholder="0244 000 000" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <Input label="Email" type="email" placeholder="you@email.com" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                <Input label="Company / Organization (if applicable)" placeholder="Optional" value={form.org_name} onChange={(e) => setForm((f) => ({ ...f, org_name: e.target.value }))} />
                {error && <p className="text-xs text-red font-semibold bg-red/5 rounded-lg px-3 py-2">{error}</p>}
                <Turnstile onToken={setToken} />
                <Button variant="dark" size="lg" className="w-full" disabled={sending}>
                  {sending ? "Submitting…" : "Submit Interest"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>
      </main>
      <Footer />
    </div>
  );
}
