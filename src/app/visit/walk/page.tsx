"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button, Input } from "@/components/ui";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  chargeDonation,
  confirmDonation,
  type MoMoNetwork,
} from "@/lib/payments";
import { IMPACT_BILL, TOUR_WALKS, clampGuests, tourTierId, tourTotal } from "@/lib/tours";

const NETWORKS: MoMoNetwork[] = ["mtn", "telecel", "at"];

export default function WalkPage() {
  const [walkId, setWalkId] = useState("wetland-market-walk");
  const [guests, setGuests] = useState("4");
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<MoMoNetwork>("mtn");
  const [token, setToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chargeRef, setChargeRef] = useState<string | null>(null);
  const [promptPhone, setPromptPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const walk = TOUR_WALKS.find((w) => w.id === walkId) ?? TOUR_WALKS[0];
  const total = tourTotal(walk.id, Number(guests));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (walk.whatsappOnly || total == null) {
      setError("This edition books over WhatsApp only — tap below.");
      return;
    }
    if (!name.trim()) return setError("Tell us your name.");
    if (!phone.trim()) return setError("Enter the MoMo phone number to charge.");
    if (!date) return setError("Pick your preferred date — the concierge confirms it.");
    if (!token) return setError("Please complete the human check first.");
    setSending(true);
    const human = await verifyTurnstile(token);
    if (!human.success) {
      setSending(false);
      return setError(human.error ?? "Human check failed.");
    }
    const result = await chargeDonation({
      amount_ghs: total,
      tier_id: tourTierId(walk.id),
      full_name: name.trim(),
      phone: phone.trim(),
      email: null,
      network,
    });
    setSending(false);
    if (!result.ok) {
      const detail = result.code
        ? `${result.error ?? "Payment request failed."} (${result.code})`
        : (result.error ?? "Payment request failed. Please try again.");
      return setError(detail);
    }
    setPromptPhone(result.payer ?? phone.trim());
    if (result.otp_required && result.ref) {
      setChargeRef(result.ref);
      setOtp("");
      return;
    }
    setSubmitted(true);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!chargeRef || total == null) return;
    setError(null);
    setVerifying(true);
    const result = await confirmDonation({
      ref: chargeRef,
      otp,
      amount_ghs: total,
      phone: phone.trim(),
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
  }

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
      <main className="w-full">
        <section className="bg-navy py-16 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="text-xs font-bold tracking-widest uppercase text-amber mb-3">
              Discover Klagon · Community-Narrated
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold text-white tracking-tight leading-tight mb-3">
              You don&apos;t visit Klagon. You meet it.
            </h1>
            <p className="text-white/60 text-sm max-w-lg mx-auto">
              One market, one kitchen, one wetland, one street at a time — told by vendors,
              elders, factory workers, and youth who wake up here. No script written in an
              office.
            </p>
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TOUR_WALKS.map((w) => (
              <div key={w.id} className="border border-border rounded-2xl p-5 sm:p-6">
                <div className="text-sm font-extrabold text-navy mb-1">{w.name}</div>
                <p className="text-xs text-gray leading-relaxed mb-3">{w.tagline}</p>
                <div className="text-[11px] text-gray mb-1">
                  {w.duration} · {w.groupSize}
                </div>
                <div className="text-lg font-extrabold text-navy">
                  {w.priceGhs != null ? `GH₵${w.priceGhs} / person` : "Price on request"}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-light py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy tracking-tight mb-2">Book a walk</h2>
            <p className="text-sm text-gray mb-6">
              Pay with MoMo now; our concierge confirms your date over WhatsApp.
            </p>

            {submitted ? (
              <div className="bg-white border border-border rounded-2xl p-8 text-center">
                <div className="text-3xl mb-3">🎉</div>
                <div className="text-sm font-extrabold text-navy mb-1">Booking received!</div>
                <p className="text-sm text-gray">
                  Our concierge will confirm {walk.name} for {clampGuests(Number(guests))}{" "}
                  guest(s) over WhatsApp shortly.
                </p>
              </div>
            ) : chargeRef ? (
              <form onSubmit={handleVerify} className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-3">
                <p className="text-sm text-gray">
                  Enter the code sent to <span className="font-bold text-navy">{promptPhone}</span>.
                </p>
                <Input
                  label="OTP code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                />
                {error && <div className="text-xs font-semibold text-red-700">{error}</div>}
                <Button variant="primary" disabled={verifying}>
                  {verifying ? "Verifying…" : "Confirm Booking →"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 flex flex-col gap-3">
                <label className="text-xs font-bold text-navy">
                  Walk
                  <select
                    value={walkId}
                    onChange={(e) => setWalkId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm font-normal"
                  >
                    {TOUR_WALKS.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} {w.priceGhs != null ? `— GH₵${w.priceGhs}/person` : "(WhatsApp only)"}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Guests (4–10)"
                    type="number"
                    min={4}
                    max={10}
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  />
                  <Input
                    label="Preferred date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input
                    label="MoMo phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0244 000 000"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-navy mb-2">Network</div>
                  <div className="flex gap-2">
                    {NETWORKS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNetwork(n)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border transition-colors ${
                          network === n
                            ? "bg-navy text-white border-navy"
                            : "bg-white text-gray border-border"
                        }`}
                      >
                        {n.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                {total != null && (
                  <div className="text-sm font-extrabold text-navy">
                    Total: GH₵{total.toLocaleString()} ({clampGuests(Number(guests))} guests)
                  </div>
                )}
                <Turnstile onToken={setToken} />
                {error && <div className="text-xs font-semibold text-red-700">{error}</div>}
                <Button variant="primary" size="lg" disabled={sending || walk.whatsappOnly}>
                  {sending ? "Processing…" : walk.whatsappOnly ? "WhatsApp Only — See Below" : `Pay GH₵${(total ?? 0).toLocaleString()} →`}
                </Button>
                <a
                  href={`https://wa.me/233268708895?text=${encodeURIComponent(`Hello KLAGON, I want to book: ${walk.name}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center text-xs font-bold text-navy underline"
                >
                  Or book over WhatsApp →
                </a>
              </form>
            )}
          </div>
        </section>

        <section className="bg-white py-14 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-extrabold text-navy tracking-tight mb-2">The Impact Bill</h2>
            <p className="text-sm text-gray mb-4">
              After every walk, a receipt for every cedi — reported quarterly:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {IMPACT_BILL.map((b) => (
                <div key={b.share} className="border border-border rounded-xl p-4 text-center">
                  <div className="text-xl font-extrabold text-navy">{b.share}</div>
                  <div className="text-[11px] text-gray mt-1">{b.text}</div>
                </div>
              ))}
            </div>
            <h2 className="text-xl font-extrabold text-navy tracking-tight mb-2">Who governs it</h2>
            <p className="text-sm text-gray leading-relaxed">
              Klagon is one of 11 Tema West electoral areas, under Mantse Nii Bortey Klan I of
              the Nii Borquaye House of Nungua. Stories and campaigns are labelled, consent comes
              first, corrections are public.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
