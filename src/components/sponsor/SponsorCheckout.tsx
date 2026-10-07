"use client";

import { useState } from "react";
import { Button, Input, ConsentBox } from "@/components/ui";
import { recordContactConsent, type MarketingChannel } from "@/lib/consent";
import { Turnstile } from "@/components/Turnstile";
import { verifyTurnstile } from "@/lib/turnstile";
import { chargeSponsor, confirmSponsor } from "@/lib/sponsorPayments";
import type { MoMoNetwork } from "@/lib/payments";
import { ORG_WA, waLink } from "@/lib/wa";
import { SPONSOR_TIERS } from "@/lib/constants";
import type { SponsorPlan } from "@/types";

const NETWORKS: MoMoNetwork[] = ["mtn", "telecel", "at"];
/** This checkout takes a MoMo number and, optionally, an email address. */
const CONSENT_CHANNELS: readonly MarketingChannel[] = ["email", "sms", "whatsapp"];

/**
 * Self-serve sponsorship checkout for the priced tiers (Community → Digital).
 *
 * The browser only names the tier; the Worker derives the monthly fee from the
 * database (sponsor_quote) and the Moolre callback marks the order paid. The
 * partner is then promoted by an admin from the paid queue — nothing here can
 * create or activate a sponsor.
 */
export function SponsorCheckout({ plan }: { plan: SponsorPlan }) {
  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<MoMoNetwork>("mtn");
  const [token, setToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chargeRef, setChargeRef] = useState<string | null>(null);
  const [promptPhone, setPromptPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number | null>(null);
  const [consent, setConsent] = useState(false);

  const tierInfo = SPONSOR_TIERS.find((t) => t.id === plan.tier);
  const monthly = tierInfo?.priceMonthly ?? null;
  const priceLabel = monthly ? `GH₵ ${monthly.toLocaleString("en-GH")}` : plan.amount;

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) return setError("Enter your name or organisation.");
    if (!phone.trim()) return setError("Enter the MoMo number to charge.");
    if (!token) return setError("Please complete the human check first.");
    setSending(true);
    const human = await verifyTurnstile(token);
    if (!human.success) {
      setSending(false);
      return setError(human.error ?? "Human check failed.");
    }
    // Optional: paying for a sponsorship must not depend on accepting
    // marketing, and the payment prompts that follow are transactional.
    if (consent) {
      await recordContactConsent({
        email: email.trim() || null,
        phone,
        channels: CONSENT_CHANNELS,
        granted: true,
        form_source: "sponsor-checkout",
      });
    }
    const result = await chargeSponsor({
      tier: plan.tier,
      full_name: fullName.trim(),
      org_name: orgName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim(),
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
    setPaidAmount(result.amount_ghs ?? monthly);
    if (result.otp_required && result.ref) {
      setChargeRef(result.ref);
      setOtp("");
      return;
    }
    setSubmitted(true);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!chargeRef) return;
    setError(null);
    setVerifying(true);
    const result = await confirmSponsor({ ref: chargeRef, otp, phone: phone.trim(), network });
    setVerifying(false);
    if (!result.ok) {
      const detail = result.code
        ? `${result.error ?? "Verification failed."} (${result.code})`
        : (result.error ?? "Verification failed. Check the code and try again.");
      return setError(detail);
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-border p-8 text-center">
        <div className="text-3xl mb-3">🤝</div>
        <h3 className="text-base font-bold text-navy mb-1">Thank you!</h3>
        <p className="text-sm text-gray">
          We received your {plan.name} sponsorship{paidAmount ? ` of GH₵ ${paidAmount.toLocaleString("en-GH")}` : ""}.
          Your benefits activate once payment clears — our partnerships team will reach out to set up your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border p-6 sm:p-8">
      {chargeRef ? (
        <form className="flex flex-col gap-4" onSubmit={verify}>
          <div>
            <h3 className="text-base font-bold text-navy">Enter the MoMo code</h3>
            <p className="text-xs text-gray mt-1">
              We sent a code to <span className="font-bold">{promptPhone}</span>. Enter it to approve{" "}
              {priceLabel}.
            </p>
          </div>
          <Input
            id="sponsor-otp"
            label="OTP code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          {error && (
            <p className="text-xs text-red font-semibold bg-red/5 rounded-lg px-3 py-2">
              {error}{" "}
              <a
                href={waLink(ORG_WA, `Hello, I paid for the ${plan.name} sponsorship on KLAGON but hit a snag.`)}
                target="_blank"
                rel="noreferrer"
                className="underline font-bold"
              >
                Message us on WhatsApp
              </a>
            </p>
          )}
          <div className="flex gap-2">
            <Button variant="dark" size="lg" className="flex-1" type="submit" disabled={verifying}>
              {verifying ? "Verifying…" : "Confirm payment"}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              type="button"
              onClick={() => {
                setChargeRef(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={start}>
          <div className="bg-pale rounded-xl p-3 text-center">
            <span className="text-xs text-gray">Selected tier: </span>
            <span className="text-sm font-bold text-navy">{plan.name} — {plan.amount}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="sponsor-name"
              label="Full name / Org name"
              placeholder="Your name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              id="sponsor-phone"
              label="MoMo phone"
              placeholder="0244 000 000"
              inputMode="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <Input
            id="sponsor-email"
            label="Email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            id="sponsor-org"
            label="Company / Organization"
            placeholder="Optional"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
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
                      : "bg-white text-navy border-navy/15 hover:border-navy/30"
                  }`}
                >
                  {n === "at" ? "AT" : n.charAt(0).toUpperCase() + n.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray">
            Pay the first month by Mobile Money. Your partner benefits activate once payment clears.
          </p>
          {error && (
            <p className="text-xs text-red font-semibold bg-red/5 rounded-lg px-3 py-2">
              {error}{" "}
              <a
                href={waLink(ORG_WA, `Hello, I would like to pay for the ${plan.name} sponsorship on KLAGON.`)}
                target="_blank"
                rel="noreferrer"
                className="underline font-bold"
              >
                Message us on WhatsApp
              </a>
            </p>
          )}
          <ConsentBox
            checked={consent}
            onChange={setConsent}
            channels={CONSENT_CHANNELS}
            purpose="news, program updates and invitations"
            formSource="sponsor-checkout"
          />
          <Turnstile onToken={setToken} />
          <Button variant="dark" size="lg" className="w-full" type="submit" disabled={sending}>
            {sending ? "Starting…" : `Pay ${priceLabel}/mo`}
          </Button>
        </form>
      )}
    </div>
  );
}
