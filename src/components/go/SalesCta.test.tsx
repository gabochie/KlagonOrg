import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SalesCta, waLink } from "@/components/go/SalesCta";

/**
 * Guards the demand-gen click path: the right WhatsApp message for the right
 * funnel, Enrol pointing at a real paid course (not generic register), and
 * telemetry firing on every exit. A wrong message or a dead-end Enrol link
 * fails silently in production — no error, just lost revenue.
 */

afterEach(cleanup);

vi.mock("@/lib/analytics", () => ({
  recordLeadEvent: vi.fn(),
}));

import { recordLeadEvent } from "@/lib/analytics";

const mocked = vi.mocked(recordLeadEvent);

describe("waLink", () => {
  it("builds a wa.me URL with the message encoded", () => {
    const url = waLink("Hello KLAGON", "ai-sprint-b2c");
    expect(url.startsWith("https://wa.me/233268708895?text=")).toBe(true);
    expect(decodeURIComponent(url.split("text=")[1])).toContain("Hello KLAGON");
  });

  it("tags the campaign so broadcasts stay attributable", () => {
    const url = waLink("hi", "freelance-b2c", "freelance-sprint");
    expect(decodeURIComponent(url)).toContain("freelance-sprint");
  });
});

describe("SalesCta", () => {
  it("points Enrol at the paid course when courseId is set", () => {
    const { container } = render(
      <SalesCta
        source="ai-sprint-b2c"
        label="Enrol in the sprint"
        price={150}
        courseId="d65e71c1-d194-4352-a183-7f8133b9967a"
      />
    );
    const enrol = screen.getByRole("link", { name: /Enrol in the sprint/ });
    expect(enrol.getAttribute("href")).toBe(
      "/learning/d65e71c1-d194-4352-a183-7f8133b9967a"
    );
    expect(container.textContent).toContain("GH₵ 150");
  });

  it("falls back to register only when no courseId (free/concierge)", () => {
    render(<SalesCta source="go-hire" label="Meet 3 candidates" />);
    const cta = screen.getByRole("link", { name: /Meet 3 candidates/ });
    expect(cta.getAttribute("href")).toBe("/auth/register");
  });

  it("shows the GH₵ price on paid CTAs", () => {
    const { container } = render(
      <SalesCta source="freelance-b2c" price={100} courseId="x" label="Enrol" />
    );
    expect(container.textContent).toContain("GH₵ 100");
  });

  it("fires telemetry on enrol, WhatsApp and secondary clicks", () => {
    render(<SalesCta source="ai-sprint-b2c" label="Enrol in the sprint" price={150} courseId="x" />);
    fireEvent.click(screen.getByRole("link", { name: /Enrol in the sprint/ }));
    fireEvent.click(screen.getByRole("link", { name: /WhatsApp us first/ }));
    fireEvent.click(screen.getByRole("link", { name: /See how it works/ }));
    const actions = mocked.mock.calls.map((c) => (c[0] as { action: string }).action);
    expect(actions).toContain("sales-enrol-click");
    expect(actions).toContain("whatsapp-click");
    expect(actions).toContain("sales-secondary-click");
  });
});
