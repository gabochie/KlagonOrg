import { describe, it, expect } from "vitest";
import {
  consentPasses,
  normalizeListingPhone,
  dedupeKeyFor,
  validateListingRow,
  parseListingCsv,
  LISTING_CSV_TEMPLATE,
  type RawListingRow,
} from "./listingImport";

function row(overrides: Partial<RawListingRow> = {}): RawListingRow {
  return {
    type: "classified",
    category: "Properties",
    subcategory: "House",
    title: "3-bed house for rent, Klagon",
    excerpt: "Fenced 3-bed",
    body: "Full description",
    price_ghs: "2500",
    area: "klagon",
    contact_name: "Ama Landlady",
    contact_phone: "0244123456",
    contact_email: "",
    event_date: "",
    event_time: "",
    event_location: "",
    consent_status: "OPTED_IN",
    consent_date: "2026-09-18",
    source: "whatsapp",
    notes: "",
    ...overrides,
  };
}

describe("listing import kernel", () => {
  it("passes a clean opt-in row", () => {
    const v = validateListingRow(row(), 2);
    expect(v.importable).toBe(true);
    expect(v.listing?.price_ghs).toBe(2500);
    expect(v.listing?.area).toBe("klagon");
  });

  it("quarantines anything without explicit OPTED_IN consent", () => {
    for (const bad of ["", "NONE", "B2B_PUBLISHED", "PENDING", "opted in?"]) {
      const v = validateListingRow(row({ consent_status: bad }), 2);
      expect(v.importable).toBe(false);
      expect(v.reasons[0]).toMatch(/no-consent/);
    }
  });

  it("quarantines missing consent date, bad phone, short title, bad price", () => {
    expect(validateListingRow(row({ consent_date: "" }), 2).reasons).toContain("consent-date-missing");
    expect(validateListingRow(row({ contact_phone: "123" }), 2).reasons).toContain("no-phone");
    expect(validateListingRow(row({ title: "Hi" }), 2).reasons).toContain("title-too-short");
    expect(validateListingRow(row({ price_ghs: "-5" }), 2).reasons[0]).toMatch(/bad-price/);
  });

  it("rejects unknown types and areas", () => {
    expect(validateListingRow(row({ type: "scam" }), 2).reasons[0]).toMatch(/bad-type/);
    expect(validateListingRow(row({ area: "accra" }), 2).reasons[0]).toMatch(/bad-area/);
  });

  it("normalizes phones and builds stable dedupe keys", () => {
    expect(normalizeListingPhone("0244123456")).toBe("233244123456");
    expect(normalizeListingPhone("+233 24 412 3456")).toBe("233244123456");
    expect(dedupeKeyFor("233244123456", "3-Bed House,  Klagon!")).toBe(
      dedupeKeyFor("233244123456", "3 bed house klagon")
    );
  });

  it("parses the shipped template (quoted commas included)", () => {
    const rows = parseListingCsv(LISTING_CSV_TEMPLATE);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toContain("3-bed house");
    const v = validateListingRow(rows[0], 2);
    expect(v.importable).toBe(true);
  });

  it("consent gate is case-insensitive but strict", () => {
    expect(consentPasses("opted_in")).toBe(true);
    expect(consentPasses(" OPTED_IN ")).toBe(true);
    expect(consentPasses("opted in")).toBe(false);
  });
});
