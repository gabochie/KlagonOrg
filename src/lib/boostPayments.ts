// KLAGON.org paid boosts — talks to the klagon-payments Worker, never to Moolre
// directly. No secrets live here; the Worker holds all Moolre keys server-side
// and derives the boost price from the listing (boost_quote), so the amount is
// never taken from the browser.

import type { MoMoNetwork } from "@/lib/payments";

const WORKER_URL = "https://klagon-payments.gideonabochie.workers.dev";

export interface BoostChargeInput {
  post_id: string;
  phone: string;
  network: MoMoNetwork;
}

export interface BoostChargeResult {
  ok: boolean;
  ref?: string;
  payer?: string;
  otp_required?: boolean;
  amount_ghs?: number;
  days?: number;
  tier?: string;
  error?: string;
  code?: string;
}

export interface BoostConfirmInput {
  ref: string;
  otp: string;
  phone: string;
  network: MoMoNetwork;
}

export interface BoostConfirmResult {
  ok: boolean;
  ref?: string;
  error?: string;
  code?: string;
}

export async function chargeBoost(input: BoostChargeInput): Promise<BoostChargeResult> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/api/boosts/charge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: "Could not reach the payment service. Check your connection and try again." };
  }

  let body: BoostChargeResult;
  try {
    body = (await res.json()) as BoostChargeResult;
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

export async function confirmBoost(input: BoostConfirmInput): Promise<BoostConfirmResult> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/api/boosts/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: "Could not reach the payment service. Check your connection and try again." };
  }

  let body: BoostConfirmResult;
  try {
    body = (await res.json()) as BoostConfirmResult;
  } catch {
    return { ok: false, error: "Unexpected response from the payment service. Please try again." };
  }

  if (!res.ok || !body.ok) {
    return { ok: false, error: body.error ?? "Verification failed. Please try again.", code: body.code };
  }
  return body;
}
