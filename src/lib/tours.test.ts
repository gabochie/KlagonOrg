import { describe, it, expect } from "vitest";
import { clampGuests, tourTotal, tourTierId, TOUR_WALKS } from "./tours";

describe("tour booking math", () => {
  it("clamps party size to 4–10", () => {
    expect(clampGuests(2)).toBe(4);
    expect(clampGuests(6)).toBe(6);
    expect(clampGuests(20)).toBe(10);
    expect(clampGuests(NaN)).toBe(4);
  });

  it("prices the signature walk per guest", () => {
    expect(tourTotal("wetland-market-walk", 4)).toBe(3000);
    expect(tourTotal("dawn-birding", 5)).toBe(1750);
  });

  it("returns null for WhatsApp-only editions", () => {
    expect(tourTotal("homowo-edition", 6)).toBeNull();
    expect(tourTotal("nope", 6)).toBeNull();
  });

  it("namespaces booking tiers off donations", () => {
    expect(tourTierId("wetland-market-walk")).toBe("tour:wetland-market-walk");
  });

  it("keeps the priced catalog consistent", () => {
    for (const w of TOUR_WALKS) {
      if (!w.whatsappOnly) expect(w.priceGhs).toBeGreaterThan(0);
    }
  });
});
