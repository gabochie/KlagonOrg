// KlagonOrg donations — talks to the klagon-payments Worker, never to Moolre directly.
// No secrets live here; the Worker holds all Moolre keys server-side.

const WORKER_URL = "https://klagon-payments.gideonabochie.workers.dev";

export type MoMoNetwork = "mtn" | "telecel" | "at";

export interface ChargeInput {
  amount_ghs: number;
  tier_id: string | null;
  full_name: string | null;
  phone: string;
  email: string | null;
  network: MoMoNetwork;
}

export interface ChargeResult {
  ok: boolean;
  ref?: string;
  payer?: string;
  otp_required?: boolean;
  error?: string;
  code?: string;
}

export interface ConfirmInput {
  ref: string;
  otp: string;
  amount_ghs: number;
  phone: string;
  network: MoMoNetwork;
}

export interface ConfirmResult {
  ok: boolean;
  ref?: string;
  error?: string;
  code?: string;
}

export async function chargeDonation(input: ChargeInput): Promise<ChargeResult> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/api/donations/charge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: "Could not reach the payment service. Check your connection and try again." };
  }

  let body: ChargeResult;
  try {
    body = (await res.json()) as ChargeResult;
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

export async function confirmDonation(input: ConfirmInput): Promise<ConfirmResult> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/api/donations/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: "Could not reach the payment service. Check your connection and try again." };
  }

  let body: ConfirmResult;
  try {
    body = (await res.json()) as ConfirmResult;
  } catch {
    return { ok: false, error: "Unexpected response from the payment service. Please try again." };
  }

  if (!res.ok || !body.ok) {
    return { ok: false, error: body.error ?? "Verification failed. Please try again.", code: body.code };
  }
  return body;
}
