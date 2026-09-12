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
