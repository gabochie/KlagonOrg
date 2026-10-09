import { afterEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ConsentBox } from "@/components/ui/ConsentBox";
import { CONSENT_TEXT_VERSION } from "@/lib/consent";

/**
 * The three properties that are easy to lose and expensive to lose.
 *
 * - It starts unticked. Nothing pre-ticks it, and reading it does not count as
 *   accepting it.
 * - The Privacy Policy link does not tick it. A visitor who opens the policy to
 *   decide has not decided, and a silent tick there would record permission
 *   they never gave.
 * - The channels, form source and wording version are on screen as data
 *   attributes, so what they saw can be compared against what the ledger holds.
 *
 * The component is controlled, so these assert what it reports upward rather
 * than what it renders back. No `@testing-library/jest-dom` in this repo, so
 * attribute checks are plain getAttribute calls (same as DashboardShell.test.tsx).
 */

afterEach(cleanup);

const renderBox = (props: Partial<ComponentProps<typeof ConsentBox>> = {}) => {
  const onChange = vi.fn();
  render(
    <ConsentBox
      checked={false}
      onChange={onChange}
      purpose="monthly news and program updates"
      formSource="footer"
      {...props}
    />,
  );
  return { onChange, box: screen.getByRole("checkbox") as HTMLInputElement };
};

describe("ConsentBox", () => {
  it("renders unticked and never ticks itself on render", () => {
    const { box, onChange } = renderBox();
    expect(box.checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("reports the visitor's own click", () => {
    const { box, onChange } = renderBox();
    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("does not tick when the Privacy Policy link is opened", () => {
    const { box, onChange } = renderBox();
    fireEvent.click(screen.getByRole("link", { name: /privacy policy/i }));
    expect(onChange).not.toHaveBeenCalled();
    expect(box.checked).toBe(false);
  });

  it("names only the channels this form actually sends on", () => {
    renderBox({ channels: ["email"] });
    expect(screen.getByText(/marketing by email from KLAGON\.org/).textContent).toContain(
      "marketing by email",
    );
    cleanup();

    renderBox({ channels: ["sms", "whatsapp"], formSource: "walk-booking" });
    expect(screen.getByText(/marketing by SMS or WhatsApp from KLAGON\.org/).textContent).toContain(
      "SMS or WhatsApp",
    );
    cleanup();

    renderBox({ formSource: "contact-form" });
    expect(
      screen.getByText(/marketing by email, SMS or WhatsApp from KLAGON\.org/).textContent,
    ).toContain("email, SMS or WhatsApp");
  });

  it("publishes the wording version, channels and source for later audit", () => {
    renderBox({ channels: ["email", "sms"], formSource: "contact-form" });
    const label = screen.getByTestId("consent-box-contact-form");
    expect(label.getAttribute("data-consent-version")).toBe(CONSENT_TEXT_VERSION);
    expect(label.getAttribute("data-consent-channels")).toBe("email,sms");
    expect(label.getAttribute("data-consent-source")).toBe("contact-form");
  });

  it("marks consent required only when the form says consent is the point", () => {
    const { box } = renderBox();
    expect(box.getAttribute("aria-required")).toBeNull();

    cleanup();
    const { box: required } = renderBox({ required: true });
    expect(required.getAttribute("aria-required")).toBe("true");
  });

  it("surfaces a recording failure without touching the tick", () => {
    const { box, onChange } = renderBox({
      required: true,
      error: "We could not save your choice. Please try again.",
    });
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("could not save your choice");
    expect(alert.getAttribute("id")).toBe("consent-footer-error");
    expect(box.getAttribute("aria-invalid")).toBe("true");
    expect(box.getAttribute("aria-describedby")).toBe("consent-footer-error");
    expect(box.checked).toBe(false);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders the dark variant without changing what it reports", () => {
    const { box, onChange } = renderBox({ variant: "dark", formSource: "coming-soon-waitlist" });
    expect(
      screen.getByTestId("consent-box-coming-soon-waitlist").getAttribute("data-consent-source"),
    ).toBe("coming-soon-waitlist");
    fireEvent.click(screen.getByRole("link", { name: /privacy policy/i }));
    expect(onChange).not.toHaveBeenCalled();
    expect(box.checked).toBe(false);
  });
});
