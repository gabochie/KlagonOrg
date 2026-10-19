import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { usePaymentStatus } from "@/components/payments/usePaymentStatus";

/**
 * Settlement truth for every checkout: paid only on provider==paid/settled,
 * failed on provider==failed, timeout after maxTries — never on
 * charge-accepted. Fake timers would be faster; real short intervals keep the
 * async polling path honest.
 */

vi.mock("@/lib/coursePayments", () => ({
  fetchCourseStatus: vi.fn(),
}));

import { fetchCourseStatus } from "@/lib/coursePayments";

const mocked = vi.mocked(fetchCourseStatus);

describe("usePaymentStatus", () => {
  it("starts idle without a ref", () => {
    const { result } = renderHook(() => usePaymentStatus(null));
    expect(result.current).toBe("idle");
  });

  it("goes paid on provider paid and calls onPaid once", async () => {
    mocked.mockResolvedValue({ ok: true, provider: "paid", settled: true });
    const onPaid = vi.fn();
    const { result } = renderHook(() =>
      usePaymentStatus("KLG-C-X", { intervalMs: 10, onPaid })
    );
    expect(result.current).toBe("awaiting");
    await waitFor(() => expect(result.current).toBe("paid"));
    expect(onPaid).toHaveBeenCalledTimes(1);
  });

  it("goes failed on provider failed", async () => {
    mocked.mockResolvedValue({ ok: true, provider: "failed" });
    const { result } = renderHook(() => usePaymentStatus("KLG-C-X", { intervalMs: 10 }));
    await waitFor(() => expect(result.current).toBe("failed"));
  });

  it("times out after maxTries of pending", async () => {
    mocked.mockResolvedValue({ ok: true, provider: "pending" });
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      usePaymentStatus("KLG-C-X", { intervalMs: 10, maxTries: 3, onTimeout })
    );
    await waitFor(() => expect(result.current).toBe("timeout"));
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("keeps polling through pending until paid", async () => {
    mocked
      .mockResolvedValueOnce({ ok: true, provider: "pending" })
      .mockResolvedValueOnce({ ok: true, provider: "pending" })
      .mockResolvedValue({ ok: true, provider: "paid", settled: true });
    const { result } = renderHook(() => usePaymentStatus("KLG-C-X", { intervalMs: 10 }));
    await waitFor(() => expect(result.current).toBe("paid"), { timeout: 5000 });
    expect(mocked.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it("cleans up on unmount without act warnings", () => {
    mocked.mockResolvedValue({ ok: true, provider: "pending" });
    const { unmount } = renderHook(() => usePaymentStatus("KLG-C-X", { intervalMs: 10 }));
    act(() => {
      unmount();
    });
  });
});
