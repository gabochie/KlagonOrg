"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { SPONSOR_PLANS } from "@/lib/constants";
import { Button, Input } from "@/components/ui";
import { CheckCircle, ArrowRight, Building2, TrendingUp, Users, Globe } from "lucide-react";
import { notifyTeam } from "@/lib/notify";
import { submitSponsorApplication } from "@/lib/forms";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";

const STATS = [
  { icon: Building2, label: "Active partner businesses", value: "3+" },
  { icon: Users, label: "Young people impacted", value: "70+" },
  { icon: TrendingUp, label: "Profile views per partner", value: "4,000+" },
  { icon: Globe, label: "Klagon area reach", value: "5+" },
];

export default function SponsorPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full overflow-hidden">
          <main className="w-full">
            <section className="bg-light py-20 px-4 text-center text-sm text-gray">
              Loading…
            </section>
          </main>
        </div>
      }
    >
      <SponsorPageContent />
    </Suspense>
  );
}

function SponsorPageContent() {
  const params = useSearchParams();
  const interest = (params.get("interest") ?? "").trim();
  const matchedPlan = SPONSOR_PLANS.find(
    (p) =>
      p.id.toLowerCase() === interest.toLowerCase() ||
      p.name.toLowerCase() === interest.toLowerCase(),
  );
  const [selected, setSelected] = useState(matchedPlan?.id ?? "growth");
  const [interestMsg] = useState(() =>
    interest && !matchedPlan ? `Interested in sponsoring: ${interest}` : null,
  );
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
      message: interestMsg,
    });
    setSending(false);
    if (err) return setError(err);
    setSubmitted(true);
    notifyTeam("sponsor", {
      "Partner tier": plan?.name ?? selected,
      "Full name / Org": form.full_name,
      "Company": form.org_name || "",
      Phone: form.phone,
      Email: form.email,
    });
  };

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Partner with KLAGON
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              Sponsor KLAGON, grow your business,
              <br className="hidden sm:block" />
              and build Ghana&apos;s future workforce.
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed">
              Your sponsorship gives you trusted visibility, digital business tools, and direct access
              to KLAGON&apos;s trained young talent — while funding workshops, mentorship, and real
              community impact.
            </p>
          </div>
        </section>

        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto mb-12">
            <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-2">
              Why businesses sponsor KLAGON
            </h2>
            <p className="text-sm text-gray text-center mb-8 max-w-lg mx-auto">
              Sponsorship is not charity — it&apos;s how local businesses build a reputation, win
              customers, and hire the best young talent in Klagon.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: "🏅",
                  title: "Trusted visibility",
                  desc: "Your verified badge, business profile, and Sponsor Wall listing tell customers you invest in the community.",
                },
                {
                  icon: "📈",
                  title: "Digital business tools",
                  desc: "Grow+ partners get a Digital Business Score, templates, and toolkits that help you win more customers.",
                },
                {
                  icon: "👥",
                  title: "Direct talent pipeline",
                  desc: "Talent+ partners can post jobs, recruit mentors, and run challenges that build your workforce.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl border border-border p-5 flex flex-col items-center text-center"
                >
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <h3 className="text-sm font-extrabold text-navy mb-1">{item.title}</h3>
                  <p className="text-xs text-gray leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-5xl mx-auto mb-14">
            <div className="bg-navy rounded-2xl p-6 sm:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                {STATS.map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className="text-center">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                        <Icon size="18" className="text-amber" />
                      </div>
                      <div className="text-xl sm:text-2xl font-extrabold text-white mb-0.5">{s.value}</div>
                      <div className="text-[11px] text-white/60">{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-2">
              Choose a partnership tier
            </h2>
            <p className="text-sm text-gray text-center mb-10 max-w-md mx-auto">
              Every tier includes a verified badge and Sponsor Wall listing. Higher tiers unlock more business value.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 justify-items-center">
              {SPONSOR_PLANS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`text-left bg-white rounded-2xl border p-6 cursor-pointer font-sans transition-all relative w-full max-w-sm ${
                    p.highlighted
                      ? "border-amber ring-2 ring-amber/20"
                      : "border-border hover:border-amber"
                  } ${selected === p.id ? "ring-2 ring-navy" : ""}`}
                >
                  {p.highlighted && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber text-navy text-[10px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap">
                      Most Popular
                    </span>
                  )}
                  <div className="text-[10px] font-bold tracking-widest uppercase text-amber mb-1">{p.headline}</div>
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
              <h2 className="text-lg font-extrabold text-navy text-center mb-2">
                Get started as a sponsor
              </h2>
              {interestMsg && (
                <div className="max-w-lg mx-auto mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-navy text-center">
                  You&apos;re enquiring about: <span className="font-extrabold">{interest}</span>
                </div>
              )}
              <p className="text-sm text-gray text-center mb-6">
                Submit the form, or reach us directly —{" "}
                <a href="tel:+233268708895" className="font-bold text-blue hover:underline">
                  0268 708 895
                </a>{" "}
                ·{" "}
                <a
                  href="https://wa.me/233268708895?text=Hello%20KLAGON.org%2C%20I%20am%20interested%20in%20sponsorship."
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue hover:underline"
                >
                  WhatsApp
                </a>
              </p>
              {submitted ? (
                <div className="bg-white rounded-2xl border border-border p-8 text-center">
                  <div className="text-3xl mb-3">🤝</div>
                  <h3 className="text-base font-bold text-navy mb-1">Thank you!</h3>
                  <p className="text-sm text-gray">
                    Our partnerships team will reach out within 2 business days to finalize details.
                  </p>
                </div>
              ) : (
                <form
                  className="bg-white rounded-2xl border border-border p-6 sm:p-8 flex flex-col gap-4"
                  onSubmit={handleSubmit}
                >
                  {plan && (
                    <div className="bg-pale rounded-xl p-3 text-center mb-1">
                      <span className="text-xs text-gray">Selected tier: </span>
                      <span className="text-sm font-bold text-navy">{plan.name} — {plan.amount}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Full name / Org name" placeholder="Your name" required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
                    <Input label="Phone" placeholder="0244 000 000" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <Input label="Email" type="email" placeholder="you@email.com" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                  <Input label="Company / Organization" placeholder="Optional" value={form.org_name} onChange={(e) => setForm((f) => ({ ...f, org_name: e.target.value }))} />
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