import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { VerifyContent } from "@/components/verify/VerifyContent";

/**
 * The certificate promise made on every /go page ("employers check it at
 * klagon.org/verify") lives or dies here. These pin the three visible states —
 * valid, revoked, miss — plus the empty-code guard, with the RPC mocked.
 * RLS shape (anon executes verify_certificate, never reads the table) is
 * asserted live in scripts/check-live-demand-gen.mjs, not here.
 */

const h = vi.hoisted(() => ({
  codeParam: "",
  rpcData: null as unknown,
  rpcError: null as { message: string } | null,
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: (k: string) => (k === "code" ? h.codeParam : null) }),
}));

vi.mock("@/lib/supabase-browser", () => ({
  getBrowserClient: () => ({
    rpc: async () => ({ data: h.rpcData, error: h.rpcError }),
  }),
}));

vi.mock("@/lib/analytics", () => ({ recordLeadEvent: vi.fn() }));

afterEach(cleanup);

async function submit(code: string) {
  render(<VerifyContent />);
  const input = screen.getByLabelText("Certificate code");
  fireEvent.change(input, { target: { value: code } });
  fireEvent.click(screen.getByText("Verify certificate"));
}

describe("VerifyContent", () => {
  it("rejects an empty code without calling the RPC", async () => {
    h.rpcData = null;
    h.rpcError = null;
    await submit("");
    expect(await screen.findByText(/Enter the certificate code/)).toBeTruthy();
  });

  it("shows the miss state when no certificate matches", async () => {
    h.rpcData = [];
    h.rpcError = null;
    await submit("KLG-XX-000000");
    expect(await screen.findByText(/No certificate found/)).toBeTruthy();
  });

  it("renders a valid certificate with holder and course", async () => {
    h.rpcData = [
      {
        code: "KLG-AU-9F3K2Q",
        recipient_name: "Ama Boateng",
        course_title: "Automate 3 Tasks at Work with AI — PRO Sprint",
        issued_at: "2026-10-01T00:00:00Z",
        revoked: false,
      },
    ];
    h.rpcError = null;
    await submit("KLG-AU-9F3K2Q");
    await waitFor(() => expect(screen.getByText("Ama Boateng")).toBeTruthy());
    expect(screen.getByText(/Valid certificate/)).toBeTruthy();
  });

  it("renders the revoked card when revoked is true", async () => {
    h.rpcData = [
      {
        code: "KLG-AU-9F3K2Q",
        recipient_name: "Ama Boateng",
        course_title: "Some Course",
        issued_at: "2026-10-01T00:00:00Z",
        revoked: true,
      },
    ];
    h.rpcError = null;
    await submit("KLG-AU-9F3K2Q");
    expect(await screen.findByText(/revoked/)).toBeTruthy();
  });

  it("surfaces RPC failure as a friendly error, not PostgREST text", async () => {
    h.rpcData = null;
    h.rpcError = { message: "permission denied" };
    await submit("KLG-AU-9F3K2Q");
    expect(await screen.findByText("permission denied")).toBeTruthy();
  });
});
