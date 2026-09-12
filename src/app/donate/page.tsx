"use client";

import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { DONATION_TIERS } from "@/lib/constants";
import { Button, Input } from "@/components/ui";
import { Heart } from "lucide-react";

export default function DonatePage() {
  const [selected, setSelected] = useState("3");
  const [customAmount, setCustomAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const tier = DONATION_TIERS.find((t) => t.id === selected);
  const displayAmount = customAmount || tier?.amount || "";

  return (
    <div className="w-full overflow-hidden">
      <Navbar />
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
            100% of donations fund KlagonStars programs. Every contribution is acknowledged.
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
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green/10 mb-3">
                  <Heart size="24" className="text-green" />
                </div>
                <h3 className="text-base font-bold text-navy mb-1">Thank you for your generosity!</h3>
                <p className="text-sm text-gray mb-4">
                  Your donation of {displayAmount} will make a real difference in Klagon.
                </p>
                <p className="text-xs text-gray">
                  A receipt will be sent to your email. You&apos;ll also receive impact updates.
                </p>
              </div>
            ) : (
              <form
                className="bg-white rounded-xl border border-border p-6 sm:p-8 flex flex-col gap-4"
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              >
                {displayAmount && (
                  <div className="bg-pale rounded-lg p-3 text-center mb-2">
                    <span className="text-xs text-gray">Donating: </span>
                    <span className="text-sm font-bold text-navy">{displayAmount}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Full name" placeholder="Your name" required />
                  <Input label="Phone" placeholder="0244 000 000" />
                </div>
                <Input label="Email" type="email" placeholder="you@email.com" required />
                <Button variant="dark" size="lg" className="w-full">
                  Donate {displayAmount}
                </Button>
                <p className="text-[10px] text-gray text-center">
                  Secure donation. You&apos;ll be redirected to complete payment after submitting.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
