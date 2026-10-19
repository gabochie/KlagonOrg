// KLAGON.org paid courses — talks to the klagon-payments Worker, never to
// Moolre directly. No secrets live here; the Worker holds all Moolre keys and
// derives the price from courses.price_ghs (course_quote), so the amount is
// never taken from the browser. Purchasing requires a signed-in member: the
// Worker verifies the Supabase access token and attaches the order to that
// uid, so a receipt can never be credited to someone else's account.

import type { MoMoNetwork } from "@/lib/payments";

const WORKER_URL = "https://klagon-payments.gideonabochie.workers.dev";

export interface CourseChargeInput {
  course_id: string;
  phone: string;
  network: MoMoNetwork;
  accessToken: string;
  turnstile_token: string | null;
}

export interface CourseChargeResult {
  ok: boolean;
  ref?: string;
  payer?: string;
  otp_required?: boolean;
  amount_ghs?: number;
  course_id?: string;
  error?: string;
  code?: string;
}

export interface CourseConfirmInput {
  ref: string;
  otp: string;
  phone: string;
  network: MoMoNetwork;
}

export interface CourseConfirmResult {
  ok: boolean;
  ref?: string;
  error?: string;
  code?: string;
}

export interface CourseStatusResult {
  ok: boolean;
  ref?: string;
  kind?: string;
  provider?: "paid" | "failed" | "pending" | string;
  settled?: boolean;
}

export async function chargeCourse(input: CourseChargeInput): Promise<CourseChargeResult> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/api/courses/charge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({
        course_id: input.course_id,
        phone: input.phone,
        network: input.network,
        turnstile_token: input.turnstile_token,
      }),
    });
  } catch {
    return { ok: false, error: "Could not reach the payment service. Check your connection and try again." };
  }

  let body: CourseChargeResult;
  try {
    body = (await res.json()) as CourseChargeResult;
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

export async function confirmCourse(input: CourseConfirmInput): Promise<CourseConfirmResult> {
  let res: Response;
  try {
    res = await fetch(`${WORKER_URL}/api/courses/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, error: "Could not reach the payment service. Check your connection and try again." };
  }

  let body: CourseConfirmResult;
  try {
    body = (await res.json()) as CourseConfirmResult;
  } catch {
    return { ok: false, error: "Unexpected response from the payment service. Please try again." };
  }

  if (!res.ok || !body.ok) {
    return { ok: false, error: body.error ?? "Verification failed. Please try again.", code: body.code };
  }
  return body;
}

// Reconciliation: the Moolre callback grants access, but webhooks get dropped.
// Poll until the order is settled, so a learner is never left staring at a
// "payment received" screen when the entitlement has already been granted.
export async function fetchCourseStatus(ref: string): Promise<CourseStatusResult> {
  try {
    const res = await fetch(`${WORKER_URL}/api/payments/status?ref=${encodeURIComponent(ref)}`);
    if (!res.ok) return { ok: false };
    return (await res.json()) as CourseStatusResult;
  } catch {
    return { ok: false };
  }
}
