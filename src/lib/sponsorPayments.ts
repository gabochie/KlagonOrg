// KLAGON.org paid sponsorships — talks to the klagon-payments Worker, never to
// Moolre directly. No secrets live here; the Worker holds all Moolre keys
// server-side and derives the tier price from the database (sponsor_quote), so
// the amount is never taken from the browser.

import type { MoMoNetwork } from "@/lib/payments";

const WORKER_URL = "https://klagon-payments.gideonabochie.workers.dev";

export interface SponsorChargeInput {
  tier: string;
  full_name: string;
  org_name?: string;
  email?: string;
  phone: string;
  network: MoMoNetwork;
  message?: string | null;
}

export interface SponsorChargeResult {
  ok: boolean;
  ref?: string;
  payer?: string;
  otp_required?: boolean;
  amount_ghs?: number;
  months?: number;
  tier?: string;
  error?: string;
  code?: string;
}

export interface SponsorConfirmInput {
  ref: string;
  otp: string;
  phone: string;
  network: MoMoNetwork;
}

export interface SponsorConfirmResult {
  ok: boolean;
  ref?: string;
  error?: string;
  code?: string;
}

export async function chargeSponsor(input: SponsorChargeInput): Promise<SponsorChargeResult> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/api/sponsors/charge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: "Could not reach the payment service. Check your connection and try again." };
  }

  let body: SponsorChargeResult;
  try {
    body = (await res.json()) as SponsorChargeResult;
  } catch {
    return { ok: false, error: "Unexpected response from the payment service. Please try again." };
  }

  if (!res.ok || !body.ok) {
    return {
      ok: false,
      error: body.error ?? "Payment request failed. Please try again.",
      code: body.code,
    };
  }
  return body;
}

export async function confirmSponsor(input: SponsorConfirmInput): Promise<SponsorConfirmResult> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/api/sponsors/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: "Could not reach the payment service. Check your connection and try again." };
  }

  let body: SponsorConfirmResult;
  try {
    body = (await res.json()) as SponsorConfirmResult;
  } catch {
    return { ok: false, error: "Unexpected response from the payment service. Please try again." };
  }

  if (!res.ok || !body.ok) {
    return { ok: false, error: body.error ?? "Verification failed. Please try again.", code: body.code };
  }
  return body;
}
