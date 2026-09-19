import { describe, it, expect } from "vitest";
import {
  normalizeFieldPhone,
  validateFieldCapture,
  FIELD_STEPS,
  type FieldCapture,
} from "./fieldKit";

function capture(overrides: Partial<FieldCapture> = {}): FieldCapture {
  return {
    businessName: "APOG Klagon",
    kind: "service",
    priceText: "Oil change GH₵150",
    phone: "0244123456",
    hours: "8am–6pm",
    address: "Sakumono Street, Klagon",
    notes: "",
    consentGiven: true,
    consentDate: "2026-09-18",
    collectorId: "user-1",
    ...overrides,
  };
}

describe("field kit kernel", () => {
  it("builds a business post payload with consent trail", () => {
    const r = validateFieldCapture(capture());
    expect(r.ok).toBe(true);
    expect(r.input?.type).toBe("business");
    expect(r.input?.category).toBe("Services");
    expect(r.input?.area).toBe("klagon");
    const details = r.input?.details as Record<string, string>;
    expect(details.consent_status).toBe("OPTED_IN");
    expect(details.collector_id).toBe("user-1");
  });

  it("blocks publish without YES, date, phone, or name", () => {
    expect(validateFieldCapture(capture({ consentGiven: false })).reasons).toContain("no-consent");
    expect(validateFieldCapture(capture({ consentDate: "" })).reasons).toContain("consent-date-missing");
    expect(validateFieldCapture(capture({ phone: "12" })).reasons).toContain("no-phone");
    expect(validateFieldCapture(capture({ businessName: "" })).reasons).toContain("business-name-missing");
  });

  it("normalizes Ghana phones", () => {
    expect(normalizeFieldPhone("0244123456")).toBe("233244123456");
    expect(normalizeFieldPhone("abc")).toBeNull();
  });

  it("ships a 5-step visit script", () => {
    expect(FIELD_STEPS).toHaveLength(5);
    expect(FIELD_STEPS[3].title).toMatch(/YES/);
  });
});
