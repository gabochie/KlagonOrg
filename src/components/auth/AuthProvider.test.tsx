import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/components/auth/AuthProvider";

/**
 * Regression tests for the session handshake.
 *
 * The bug these lock down: AuthProvider's init had no error handling, so if
 * `getSession()` or the profiles read threw, `setLoading(false)` was skipped and
 * `loading` stayed true for the life of the page. Every RequireAuth screen then
 * showed its `animate-ping` spinner forever — the "Post" tab on the mobile
 * bottom bar hung with no error and no way out.
 *
 * These assert the *outcome* (settles, and reports why when it can't) rather
 * than the retry arithmetic, so the timings stay free to change.
 */

/** 3 attempts x 6s deadline, plus 0.9s and 2.6s of backoff between them. */
const EXHAUSTED_MS = 6000 + 900 + 6000 + 2600 + 6000;

/** Comfortably past the budget, so a slow settle cannot be mistaken for a hang. */
const GIVE_UP_MS = EXHAUSTED_MS + 5000;

const h = vi.hoisted(() => ({
  getSession: vi.fn<() => Promise<unknown>>(),
  onAuthStateChange: vi.fn(),
  /** Counted rather than mocked per-call so a leaked listener is visible. */
  subscribes: 0,
  unsubscribes: 0,
}));

vi.mock("@/lib/supabase-browser", () => ({
  getBrowserClient: () => ({
    auth: { getSession: h.getSession, onAuthStateChange: h.onAuthStateChange },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }),
    }),
  }),
  isSupabaseConfigured: () => true,
}));

function Probe() {
  const { user, loading, initError, retryAuth } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{initError ?? ""}</span>
      <span data-testid="user">{user?.id ?? "none"}</span>
      <button type="button" onClick={retryAuth}>
        retry
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

const read = (id: string) => screen.getByTestId(id).textContent;

/** A promise that never settles — the failure the old code could not survive. */
const never = () => new Promise(() => {});

beforeEach(() => {
  vi.useFakeTimers();
  h.subscribes = 0;
  h.unsubscribes = 0;
  h.onAuthStateChange.mockImplementation(() => {
    h.subscribes += 1;
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            h.unsubscribes += 1;
          },
        },
      },
    };
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AuthProvider session handshake", () => {
  it("settles when the lookup succeeds and there is no session", async () => {
    h.getSession.mockResolvedValue({ data: { session: null } });

    renderProvider();
    expect(read("loading")).toBe("true");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // A genuine "not signed in" must look like signed out, not broken.
    expect(read("loading")).toBe("false");
    expect(read("error")).toBe("");
    expect(read("user")).toBe("none");
  });

  it("settles with the user when a session exists", async () => {
    h.getSession.mockResolvedValue({
      data: { session: { user: { id: "member-1" } } },
    });

    renderProvider();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(read("loading")).toBe("false");
    expect(read("error")).toBe("");
    expect(read("user")).toBe("member-1");
  });

  it("recovers when a retry succeeds after an initial failure", async () => {
    h.getSession
      .mockRejectedValueOnce(new Error("Failed to fetch"))
      .mockResolvedValueOnce({ data: { session: { user: { id: "member-2" } } } });

    renderProvider();

    // First attempt fails, then the backoff fires and the retry succeeds.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });

    expect(read("user")).toBe("member-2");
    expect(read("loading")).toBe("false");
    expect(read("error")).toBe("");
  });

  // The two tests below are the actual regression. Before the fix, `loading`
  // stayed true forever in both of these cases.
  it("does not hang when the lookup never settles", async () => {
    h.getSession.mockImplementation(never);

    renderProvider();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(GIVE_UP_MS);
    });

    expect(read("loading")).toBe("false");
    expect(read("error")).not.toBe("");
  });

  it("does not hang when every attempt rejects, and reports why", async () => {
    h.getSession.mockRejectedValue(new Error("Failed to fetch"));

    renderProvider();

    // Mid-budget it must still be trying rather than declaring failure early.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });
    expect(read("loading")).toBe("true");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(GIVE_UP_MS);
    });

    expect(read("loading")).toBe("false");
    expect(read("error")).not.toBe("");
    // Never mistaken for a signed-out member: that would bounce them to login.
    expect(read("user")).toBe("none");
  });

  it("clears the error and retries on demand", async () => {
    h.getSession.mockRejectedValue(new Error("Failed to fetch"));

    renderProvider();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(GIVE_UP_MS);
    });
    expect(read("error")).not.toBe("");

    // Connection returns; the member taps Try again.
    h.getSession.mockResolvedValue({
      data: { session: { user: { id: "member-3" } } },
    });

    await act(async () => {
      fireEvent.click(screen.getByText("retry"));
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(read("error")).toBe("");
    expect(read("loading")).toBe("false");
    expect(read("user")).toBe("member-3");
  });

  it("always unsubscribes the auth listener on unmount", async () => {
    h.getSession.mockResolvedValue({ data: { session: null } });

    const { unmount } = renderProvider();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(h.subscribes).toBeGreaterThan(0);
    unmount();
    expect(h.unsubscribes).toBe(h.subscribes);
  });

  // Each retry takes out a fresh auth listener. If the previous attempt's
  // listener is not retired first, the handle is merely overwritten and every
  // failed attempt leaves a Supabase listener subscribed to the page. Those
  // stale listeners survive unmount, so the invariant worth pinning is "at most
  // one live listener at a time" rather than a shared mock's call count.
  it("does not leak an auth listener per failed attempt", async () => {
    h.getSession.mockRejectedValue(new Error("Failed to fetch"));

    renderProvider();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(GIVE_UP_MS);
    });

    // Three attempts were made...
    expect(h.subscribes).toBe(3);
    // ...so the first two listeners must be retired. The third is still
    // mounted and deliberately live, which is exactly one.
    expect(h.unsubscribes).toBe(2);
    expect(h.subscribes - h.unsubscribes).toBe(1);
  });
});