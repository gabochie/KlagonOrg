import { describe, expect, it } from "vitest";
import { boostedFirst, isBoostActive, type Boostable } from "./boosts";

const NOW = Date.parse("2026-09-27T12:00:00.000Z");

const post = (boostTier: Boostable["boostTier"], boostUntil: string | null): Boostable => ({
  boostTier,
  boostUntil,
});

describe("isBoostActive", () => {
  it("counts a boost that has not expired yet", () => {
    expect(isBoostActive(post("featured", "2026-09-28T12:00:00.000Z"), NOW)).toBe(true);
    expect(isBoostActive(post("premium", "2026-10-04T12:00:00.000Z"), NOW)).toBe(true);
  });

  it("stops counting a boost the moment it expires", () => {
    // The regression this guards: an expired boost kept its badge and its paid
    // position indefinitely, so old promotions looked current forever.
    expect(isBoostActive(post("featured", "2026-09-27T11:59:59.000Z"), NOW)).toBe(false);
    expect(isBoostActive(post("premium", "2026-09-20T12:00:00.000Z"), NOW)).toBe(false);
  });

  it("treats the expiry instant itself as expired", () => {
    expect(isBoostActive(post("featured", "2026-09-27T12:00:00.000Z"), NOW)).toBe(false);
  });

  it("ignores a boost tier with no date", () => {
    expect(isBoostActive(post("featured", null), NOW)).toBe(false);
    expect(isBoostActive(post("premium", null), NOW)).toBe(false);
  });

  it("ignores an unparseable date rather than assuming it is live", () => {
    expect(isBoostActive(post("featured", "soon"), NOW)).toBe(false);
    expect(isBoostActive(post("featured", ""), NOW)).toBe(false);
  });

  it("never treats an unboosted listing as boosted", () => {
    expect(isBoostActive(post("none", "2027-01-01T00:00:00.000Z"), NOW)).toBe(false);
  });
});

describe("boostedFirst", () => {
  const live = post("featured", "2026-09-28T00:00:00.000Z");
  const expired = post("premium", "2026-09-01T00:00:00.000Z");
  const plain = post("none", null);

  it("puts an active boost above everything else", () => {
    // Positive means "a sorts after b", so plain-after-live is the boost winning.
    expect(boostedFirst(plain, live, NOW)).toBeGreaterThan(0);
    expect(boostedFirst(live, plain, NOW)).toBeLessThan(0);
  });

  it("treats an expired boost as unboosted", () => {
    expect(boostedFirst(plain, expired, NOW)).toBe(0);
  });

  it("is stable between two equally-boosted listings", () => {
    expect(boostedFirst(live, live, NOW)).toBe(0);
  });
});
