"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { DONATION_TIERS } from "@/lib/constants";
import { Button, Input } from "@/components/ui";
import { Heart, Smartphone, ShieldCheck } from "lucide-react";
import { chargeDonation, confirmDonation, type MoMoNetwork } from "@/lib/payments";

const NETWORKS: { id: MoMoNetwork; label: string }[] = [
  { id: "mtn", label: "MTN MoMo" },
  { id: "telecel", label: "Telecel Cash" },
  { id: "at", label: "AT Money" },
];

export default function DonatePage() {
  const [selected, setSelected] = useState("3");
  const [customAmount, setCustomAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [promptPhone, setPromptPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [network, setNetwork] = useState<MoMoNetwork>("mtn");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });

  // OTP step
  const [chargeRef, setChargeRef] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);

  const tier = DONATION_TIERS.find((t) => t.id === selected);
  const displayAmount = customAmount || tier?.amount || "";
  const amount = parseFloat((customAmount || tier?.amount || "").replace(/[^\d.]/g, ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!amount || amount <= 0) return setError("Enter a valid amount.");
    if (!form.phone.trim()) return setError("Enter the MoMo phone number to charge.");
    setSending(true);
    const result = await chargeDonation({
      amount_ghs: amount,
      tier_id: tier?.id ?? null,
      full_name: form.full_name || null,
      phone: form.phone.trim(),
      email: form.email || null,
      network,
    });
    setSending(false);
    if (!result.ok) {
      const detail = result.code
        ? `${result.error ?? "Payment request failed."} (${result.code})`
        : (result.error ?? "Payment request failed. Please try again.");
      return setError(detail);
    }
    setPromptPhone(result.payer ?? form.phone.trim());
    if (result.otp_required && result.ref) {
      setChargeRef(result.ref);
      setOtp("");
      return;
    }
    setSubmitted(true);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeRef) return;
    setError(null);
    setVerifying(true);
    const result = await confirmDonation({
      ref: chargeRef,
      otp,
      amount_ghs: amount,
      phone: form.phone.trim(),
      network,
    });
    setVerifying(false);
    if (!result.ok) {
      const detail = result.code
        ? `${result.error ?? "Verification failed."} (${result.code})`
        : (result.error ?? "Verification failed. Check the code and try again.");
      return setError(detail);
    }
    setSubmitted(true);
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
        </div>
      </section>
      <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-extrabold text-navy text-center tracking-tight mb-2">
            Choose an amount to give
          </h2>
          <p className="text-sm text-gray text-center mb-10 max-w-md mx-auto">
            100% of donations fund KlagonOrg programs. Every contribution is acknowledged.
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
          <div className="max-w-sm mx-auto mb-10">
            <Input
              label="Or enter a custom amount (GH₵)"
              type="number"
              placeholder="e.g. 75"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelected(""); }}
            />
          </div>
          <div className="max-w-lg mx-auto">
            {submitted ? (
              <div className="bg-white rounded-xl border border-border p-8 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber/15 mb-3">
                  <Smartphone size="24" className="text-amber" />
                </div>
                <h3 className="text-base font-bold text-navy mb-1">Almost done — check your phone!</h3>
                <p className="text-sm text-gray mb-4">
                  A payment prompt for {displayAmount} was sent to{" "}
                  <span className="font-bold text-navy">{promptPhone}</span>. Approve it with
                  your MoMo PIN to complete the donation.
                </p>
                <p className="text-xs text-gray">
                  A receipt will be sent to your email once payment confirms. You&apos;ll also
                  receive impact updates.
                </p>
              </div>
            ) : chargeRef ? (
              <form
                className="bg-white rounded-xl border border-border p-6 sm:p-8 flex flex-col gap-4"
                onSubmit={handleVerify}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber/15 mb-1">
                  <ShieldCheck size="24" className="text-amber" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy mb-1">Verify your donation</h3>
                  <p className="text-sm text-gray">
                    We sent an SMS code to <span className="font-bold text-navy">{promptPhone}</span>.
                    Enter it below to continue.
                  </p>
                </div>
                <Input
                  label="OTP from SMS"
                  inputMode="numeric"
                  placeholder="e.g. 483920"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
                />
                {error && <p className="text-xs text-red font-semibold bg-red/5 rounded-lg px-3 py-2">{error}</p>}
                <Button variant="dark" size="lg" className="w-full" disabled={verifying || otp.length < 4}>
                  {verifying ? "Verifying…" : "Confirm donation"}
                </Button>
                <button
                  type="button"
                  onClick={() => { setChargeRef(null); setError(null); }}
                  className="text-xs text-gray underline cursor-pointer font-sans"
                >
                  Change details
                </button>
              </form>
            ) : (
              <form
                className="bg-white rounded-xl border border-border p-6 sm:p-8 flex flex-col gap-4"
                onSubmit={handleSubmit}
              >
                {displayAmount && (
                  <div className="bg-pale rounded-lg p-3 text-center mb-2">
                    <span className="text-xs text-gray">Donating: </span>
                    <span className="text-sm font-bold text-navy">{displayAmount}</span>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-navy mb-1.5">Mobile money network</div>
                  <div className="grid grid-cols-3 gap-2">
                    {NETWORKS.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => setNetwork(n.id)}
                        className={`py-2 rounded-lg border text-xs font-bold cursor-pointer font-sans transition-all ${
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
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Full name" placeholder="Your name" required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
                  <Input label="MoMo phone" placeholder="0244 000 000" required value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <Input label="Email" type="email" placeholder="you@email.com" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                {error && <p className="text-xs text-red font-semibold bg-red/5 rounded-lg px-3 py-2">{error}</p>}
                <Button variant="dark" size="lg" className="w-full" disabled={sending}>
                  {sending ? "Sending request…" : `Donate ${displayAmount}`}
                </Button>
                <p className="text-[10px] text-gray text-center flex items-center justify-center gap-1">
                  <Heart size="10" /> Secure donation via Moolre. A confirmation prompt will be sent to your phone.
                </p>
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