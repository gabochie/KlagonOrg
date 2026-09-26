"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { DONATION_TIERS, TESTIMONIALS } from "@/lib/constants";
import { Button, Input } from "@/components/ui";
import { Heart, Phone, MessageCircle, CheckCircle } from "lucide-react";
import { recordDonationIntent, recordInKindOffer } from "@/lib/forms";
import { notifyTeam } from "@/lib/notify";
import { recordLeadEvent } from "@/lib/analytics";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";
import { useAuth } from "@/components/auth/AuthProvider";
import type { MoMoNetwork } from "@/lib/payments";

const NETWORKS: { id: MoMoNetwork; label: string }[] = [
  { id: "mtn", label: "MTN MoMo" },
  { id: "telecel", label: "Telecel Cash" },
  { id: "at", label: "AT Money" },
];

const INKIND_CATEGORIES = [
  { value: "devices", label: "Devices (laptops, phones, tablets)" },
  { value: "connectivity", label: "Connectivity (data, Wi-Fi gear, power)" },
  { value: "skills", label: "Skilled hours (dev, design, training)" },
  { value: "visibility", label: "Visibility (printing, SMS, venue, media)" },
  { value: "hosting", label: "Hosting & licenses" },
  { value: "venue", label: "Space / venue" },
  { value: "other", label: "Something else" },
];

// Public contact line (same number as the site footer).
const CONTACT_DISPLAY = "0268 708 895";
const CONTACT_TEL = "tel:+233268708895";
const CONTACT_WA = "https://wa.me/233268708895?text=Hello%20KLAGON.org%2C%20I%20would%20like%20to%20donate.";

export default function DonatePage() {
  const [selected, setSelected] = useState("3");
  const [customAmount, setCustomAmount] = useState("");
  const [frequency, setFrequency] = useState<"once" | "monthly">("once");
  const [channel, setChannel] = useState<"momo" | "card">("momo");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<MoMoNetwork>("mtn");
  const [token, setToken] = useState<string | null>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [pledged, setPledged] = useState({ amount: "", phone: "", monthly: false, name: "", card: false });

  const tier = DONATION_TIERS.find((t) => t.id === selected);
  const displayAmount = customAmount || tier?.amount || "";
  const amount = parseFloat((customAmount || tier?.amount || "").replace(/[^\d.]/g, ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amount || amount <= 0) return setError("Enter a valid amount.");
    if (channel === "momo" && !form.phone.trim()) {
      return setError("Enter the MoMo number we should reach you on.");
    }
    if (channel === "card" && !form.email.trim()) {
      return setError("Enter your email so we can send the secure payment link.");
    }
    if (!token) return setError("Please complete the human check before submitting.");
    setSending(true);
    const check = await verifyTurnstile(token);
    if (!check.success) {
      setSending(false);
      return setError(check.error ?? "Human check failed. Please try again.");
    }
    const result = await recordDonationIntent({
      amount_ghs: amount,
      tier_id: tier?.id ?? null,
      full_name: form.full_name.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      metadata:
        channel === "card"
          ? { frequency, channel: "diaspora-card" }
          : { frequency, network, channel: "momo" },
    });
    setSending(false);
    if (result.error) return setError(result.error);
    setPledged({
      amount: displayAmount,
      phone: form.phone.trim(),
      monthly: frequency === "monthly",
      name: form.full_name.trim(),
      card: channel === "card",
    });
    setSubmitted(true);
    notifyTeam("pledge", {
      Amount: displayAmount,
      Frequency: frequency,
      Channel: channel === "card" ? "Card / bank (diaspora)" : `MoMo (${network})`,
      "Full name": form.full_name.trim(),
      "MoMo phone": form.phone.trim(),
      Email: form.email.trim(),
    });
  };

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
      <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
            Make a Donation
          </div>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
            Every cedi creates opportunity.
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Your donation goes directly to workshops, equipment, mentor stipends, and community
            projects that impact Klagon&apos;s youth.
          </p>
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2">
            <a
              href={CONTACT_TEL}
              onClick={() => recordLeadEvent({ source: "donate-page", action: "call-click" })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-white text-sm font-bold hover:bg-white/15 transition-colors"
            >
              <Phone size={15} /> {CONTACT_DISPLAY}
            </a>
            <a
              href={CONTACT_WA}
              target="_blank"
              rel="noreferrer"
              onClick={() => recordLeadEvent({ source: "donate-page", action: "whatsapp-click" })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber text-navy text-sm font-bold hover:bg-amber/90 transition-colors"
            >
              <MessageCircle size={15} /> WhatsApp to donate
            </a>
          </div>
          <p className="text-white/50 text-xs mt-3">
            Prefer to talk first? Call or WhatsApp us — a person picks up.
          </p>
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mx-auto mb-12 rounded-2xl bg-navy p-6 sm:p-8 text-center">
            <div className="text-[10px] font-bold tracking-widest uppercase text-amber mb-2">
              The Community Circle
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight mb-2">
              Give monthly. Keep Klagon online.
            </h2>
            <p className="text-xs text-white/60 leading-relaxed mb-4 max-w-md mx-auto">
              GH₵20 covers a learner&apos;s data for a month · GH₵50 keeps the platform hosted ·
              GH₵100 moves volunteers across Klagon. Monthly gifts are reminders, never auto-charges.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["20", "50", "100"].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setCustomAmount(amt);
                    setSelected("");
                    setFrequency("monthly");
                  }}
                  className="px-4 py-2 rounded-lg bg-amber text-navy text-xs font-bold hover:bg-white transition-colors cursor-pointer font-sans"
                >
                  GH₵{amt}/mo
                </button>
              ))}
            </div>
          </div>
          <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-2">
            Pledge an amount to give
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 max-w-3xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="bg-white rounded-xl border border-border p-4 flex flex-col"
              >
                <blockquote className="text-[11px] text-gray leading-relaxed flex-1">
                  {t.quote}
                </blockquote>
                <figcaption className="mt-2 flex items-center gap-2">
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white flex-shrink-0"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </span>
                  <span>
                    <span className="block text-[11px] font-bold text-navy">{t.name}</span>
                    <span className="block text-[10px] text-gray">{t.role}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
          <p className="text-center text-[11px] text-gray mb-10 -mt-6">
            Real people, real outcomes.{" "}
            <a href="/impact" className="font-bold text-blue hover:underline">
              See live impact numbers →
            </a>
          </p>
          <p className="text-sm text-gray text-center mb-10 max-w-md mx-auto">
            Pledge below and we&apos;ll call or WhatsApp you within 24 hours to complete it
            by MoMo. 100% of donations fund KLAGON.org programs.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8 max-w-2xl mx-auto">
            {DONATION_TIERS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelected(t.id); setCustomAmount(""); }}
                className={`bg-white rounded-xl border p-4 text-center cursor-pointer font-sans transition-all ${
                  selected === t.id && !customAmount
                    ? "border-amber ring-2 ring-amber/20 bg-amber/5"
                    : "border-border hover:border-amber"
                }`}
              >
                <div className="text-base font-extrabold text-navy">{t.amount}</div>
                <div className="text-[10px] text-gray mt-1 leading-tight">{t.label}</div>
              </button>
            ))}
          </div>
          <div className="max-w-sm mx-auto mb-6">
            <Input
              label="Or enter a custom amount (GH₵)"
              type="number"
              placeholder="e.g. 75"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelected(""); }}
            />
          </div>
          <div className="max-w-sm mx-auto mb-10">
            <div className="text-xs font-semibold text-navy mb-1.5 text-center">How often?</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFrequency("once")}
                className={`py-2.5 rounded-lg border text-xs font-bold cursor-pointer font-sans transition-all ${
                  frequency === "once"
                    ? "border-amber bg-amber/10 text-navy"
                    : "border-border bg-white text-gray hover:border-amber"
                }`}
              >
                One-time
              </button>
              <button
                type="button"
                onClick={() => setFrequency("monthly")}
                className={`py-2.5 rounded-lg border text-xs font-bold cursor-pointer font-sans transition-all ${
                  frequency === "monthly"
                    ? "border-amber bg-amber/10 text-navy"
                    : "border-border bg-white text-gray hover:border-amber"
                }`}
              >
                Monthly reminder
              </button>
            </div>
            <p className="text-[11px] text-gray text-center mt-2">
              {frequency === "monthly"
                ? "No auto-charges — we simply send you a MoMo prompt each month."
                : "Give once today. We can always remind you again later."}
            </p>
          </div>
          <div className="max-w-lg mx-auto">
            {submitted ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 mb-3">
                  <CheckCircle size={24} className="text-emerald-700" />
                </div>
                <h3 className="text-base font-bold text-navy mb-1">
                  Medase{pledged.name ? `, ${pledged.name}` : ""}! Pledge recorded.
                </h3>
                {pledged.card ? (
                  <p className="text-sm text-gray mb-4">
                    Your {pledged.monthly ? "monthly " : ""}pledge of{" "}
                    <span className="font-bold text-navy">{pledged.amount}</span> is in.
                    We&apos;ll email you a secure card/bank payment link within 24 hours.
                  </p>
                ) : (
                  <p className="text-sm text-gray mb-4">
                    Your {pledged.monthly ? "monthly " : ""}pledge of{" "}
                    <span className="font-bold text-navy">{pledged.amount}</span> is in.
                    We&apos;ll call or WhatsApp{" "}
                    <span className="font-bold text-navy">{pledged.phone}</span> within 24
                    hours to complete it by MoMo.
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={CONTACT_TEL}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-navy text-white text-sm font-bold hover:bg-blue transition-colors"
                  >
                    <Phone size={15} /> Call now
                  </a>
                  <a
                    href={CONTACT_WA}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-border text-navy text-sm font-bold hover:border-amber transition-colors"
                  >
                    <MessageCircle size={15} /> WhatsApp us
                  </a>
                </div>
                <p className="text-xs text-gray mt-4">
                  Outside Ghana? WhatsApp us and we&apos;ll arrange a card or bank transfer.
                </p>
              </div>
            ) : (
              <form
                className="bg-white rounded-xl border border-border p-6 sm:p-8 flex flex-col gap-4"
                onSubmit={handleSubmit}
              >
                {displayAmount && (
                  <div className="bg-pale rounded-lg p-3 text-center mb-2">
                    <span className="text-xs text-gray">Pledging: </span>
                    <span className="text-sm font-bold text-navy">
                      {displayAmount}{frequency === "monthly" ? " / month (reminder)" : ""}
                    </span>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-navy mb-1.5">How do you want to give?</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setChannel("momo")}
                      className={`py-2.5 rounded-lg border text-xs font-bold cursor-pointer font-sans transition-all ${
                        channel === "momo"
                          ? "border-amber bg-amber/10 text-navy"
                          : "border-border text-gray hover:border-amber"
                      }`}
                    >
                      MoMo (Ghana)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel("card")}
                      className={`py-2.5 rounded-lg border text-xs font-bold cursor-pointer font-sans transition-all ${
                        channel === "card"
                          ? "border-amber bg-amber/10 text-navy"
                          : "border-border text-gray hover:border-amber"
                      }`}
                    >
                      Card / bank (diaspora)
                    </button>
                  </div>
                  <p className="text-[11px] text-gray text-center mt-2">
                    {channel === "card"
                      ? "No card details here — we email you a secure payment link within 24 hours."
                      : "We complete every MoMo gift by phone or WhatsApp. Outside Ghana? Use the card option."}
                  </p>
                </div>
                {channel === "momo" && (
                  <div>
                    <div className="text-xs font-semibold text-navy mb-1.5">Your MoMo network</div>
                    <div className="grid grid-cols-3 gap-2">
                      {NETWORKS.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setNetwork(n.id)}
                          className={`py-2.5 rounded-lg border text-xs font-bold cursor-pointer font-sans transition-all ${
                            network === n.id
                              ? "border-amber bg-amber/10 text-navy"
                              : "border-border text-gray hover:border-amber"
                          }`}
                        >
                          {n.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Full name" placeholder="Your name" required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
                  {channel === "momo" ? (
                    <Input label="MoMo phone" placeholder="0244 000 000" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  ) : (
                    <Input label="Phone (optional)" placeholder="With country code" required={false} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                  )}
                </div>
                <Input label={channel === "card" ? "Email (required for your payment link)" : "Email (optional)"} type="email" placeholder="you@email.com" required={channel === "card"} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                {error && <p className="text-xs text-red font-semibold bg-red/5 rounded-lg px-3 py-2">{error}</p>}
                <Turnstile onToken={setToken} />
                <Button variant="dark" size="lg" className="w-full" disabled={sending}>
                  {sending ? "Recording pledge…" : `Pledge ${displayAmount}`}
                </Button>
                <p className="text-[10px] text-gray text-center flex items-center justify-center gap-1">
                  <Heart size={10} /> No payment is taken now — we complete every gift by phone or WhatsApp.
                </p>
                <p className="text-[10px] text-gray text-center">
                  Every gift receipted by MoMo + email. 100% funds KLAGON.org programs.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
      <InKindSection />
      </main>
      <Footer />
    </div>
  );
}

function InKindSection() {
  const { profile } = useAuth();
  const [category, setCategory] = useState("devices");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("Describe what you are offering.");
    if (!name.trim() || !phone.trim()) {
      return setError("Add your name and a phone number so we can reach you.");
    }
    if (!token) return setError("Please complete the human check before submitting.");
    setSending(true);
    const check = await verifyTurnstile(token);
    if (!check.success) {
      setSending(false);
      return setError(check.error ?? "Human check failed. Please try again.");
    }
    const result = await recordInKindOffer({
      member_id: profile?.id ?? null,
      category,
      title: title.trim(),
      description: description.trim() || null,
      full_name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
    });
    setSending(false);
    if (result.error) return setError(result.error);
    setDone(true);
    notifyTeam("pledge", {
      Kind: "In-kind offer",
      Category: category,
      Item: title.trim(),
      "Full name": name.trim(),
      Phone: phone.trim(),
      Email: email.trim(),
    });
  };

  return (
    <section className="bg-pale py-14 sm:py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-2">
          Give goods, skills or space
        </h2>
        <p className="text-sm text-gray text-center mb-8 max-w-md mx-auto">
          Laptops, data bundles, pro-bono hours, printing, a venue — in-kind gifts keep Klagon
          running just like cash. Tell us what you have; we reply within 48 hours.
        </p>
        <div className="max-w-lg mx-auto">
          {done ? (
            <div className="bg-white rounded-xl border border-border p-8 text-center">
              <div className="text-3xl mb-3">🎁</div>
              <h3 className="text-base font-bold text-navy mb-1">Medase! Offer received.</h3>
              <p className="text-sm text-gray">
                Thank you{name ? `, ${name}` : ""} — our team will call or WhatsApp you within
                48 hours to arrange collection or next steps.
              </p>
            </div>
          ) : (
            <form
              className="bg-white rounded-xl border border-border p-6 sm:p-8 flex flex-col gap-4"
              onSubmit={submit}
            >
              <div>
                <div className="text-xs font-semibold text-navy mb-1.5">What are you offering?</div>
                <div className="grid grid-cols-2 gap-2">
                  {INKIND_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`py-2.5 px-2 rounded-lg border text-[11px] font-bold cursor-pointer font-sans transition-all ${
                        category === c.value
                          ? "border-amber bg-amber/10 text-navy"
                          : "border-border text-gray hover:border-amber"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Short title" placeholder="e.g. 3 used laptops, weekend venue in Sakumono" required value={title} onChange={(e) => setTitle(e.target.value)} />
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Details (condition, quantity, location, availability)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Anything that helps us say yes fast…"
                  rows={3}
                  className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-gray/50 focus:outline-none focus:border-navy"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full name" placeholder="Your name" required value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Phone" placeholder="0244 000 000" required value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <Input label="Email (optional)" type="email" placeholder="you@email.com" required={false} value={email} onChange={(e) => setEmail(e.target.value)} />
                {error && <p className="text-xs text-red font-semibold bg-red/5 rounded-lg px-3 py-2">{error}</p>}
                <Turnstile onToken={setToken} />
                <Button variant="dark" size="lg" className="w-full" disabled={sending}>
                  {sending ? "Recording pledge…" : `Pledge ${displayAmount}`}
                </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
