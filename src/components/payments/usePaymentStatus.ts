"use client";

import { useEffect, useRef, useState } from "react";
import { fetchCourseStatus } from "@/lib/coursePayments";

export type PaymentSettleState = "idle" | "awaiting" | "paid" | "failed" | "timeout";

/**
 * Shared MoMo settlement polling. The /api/payments/status endpoint settles
 * ANY order kind (course/boost/sponsor/donation) by ref, so every checkout
 * shows truth instead of assuming charge-accepted means paid. Extracted from
 * CourseCheckout.pollUntilSettled so sponsor/boost/walk stop lying on
 * `initiated`. Telemetry stays with callers (they own source/action names).
 */
export function usePaymentStatus(
  ref: string | null,
  opts?: {
    intervalMs?: number;
    maxTries?: number;
    onPaid?: () => void;
    onFailed?: () => void;
    onTimeout?: () => void;
  }
): PaymentSettleState {
  const [state, setState] = useState<PaymentSettleState>(ref ? "awaiting" : "idle");
  const timer = useRef<number | null>(null);
  const optsRef = useRef(opts);

  useEffect(() => {
    optsRef.current = opts; // latest callbacks without re-subscribing the poll
    if (!ref) return;
    let tries = 0;
    const interval = optsRef.current?.intervalMs ?? 3000;
    const max = optsRef.current?.maxTries ?? 20;
    timer.current = window.setInterval(async () => {
      tries += 1;
      const status = await fetchCourseStatus(ref);
      if (status.settled || status.provider === "paid") {
        if (timer.current) window.clearInterval(timer.current);
        timer.current = null;
        setState("paid");
        optsRef.current?.onPaid?.();
        return;
      }
      if (status.provider === "failed") {
        if (timer.current) window.clearInterval(timer.current);
        timer.current = null;
        setState("failed");
        optsRef.current?.onFailed?.();
        return;
      }
      if (tries >= max) {
        if (timer.current) window.clearInterval(timer.current);
        timer.current = null;
        setState("timeout");
        optsRef.current?.onTimeout?.();
      }
    }, interval);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      timer.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  // Derived, not stored: a fresh ref means we are awaiting even before the
  // first poll tick resolves. No setState/ref-write during render.
  return state === "idle" && ref ? "awaiting" : state;
}
