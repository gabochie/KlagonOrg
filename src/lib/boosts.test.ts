import { describe, expect, it } from "vitest";
import { boostedFirst, isBoostActive, rankWithBoosts, type Boostable, type Rankable } from "./boosts";

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

describe("rankWithBoosts", () => {
  const item = (
    id: string,
    boostTier: Boostable["boostTier"],
    boostUntil: string | null,
    publishedAt: string | null,
  ): Rankable & { id: string } => ({ id, boostTier, boostUntil, publishedAt });

  it("sinks an expired boost below newer unboosted listings", () => {
    // The regression: Postgres sorts boost_until descending with nulls last, so
    // an expired (non-null, past) boost still outranked every unboosted post.
    // The server cannot express "expired == unboosted", so ranking is redone
    // here. This listing is the NEWEST organic post and must still sit above
    // the expired boost.
    const expiredBoost = item("expired", "premium", "2026-09-20T00:00:00.000Z", "2026-09-01T00:00:00.000Z");
    const newOrganic = item("new", "none", null, "2026-09-26T00:00:00.000Z");
    const midOrganic = item("mid", "none", null, "2026-09-15T00:00:00.000Z");

    const ranked = rankWithBoosts([expiredBoost, newOrganic, midOrganic], 10, NOW);
    expect(ranked.map((p) => p.id)).toEqual(["new", "mid", "expired"]);
  });

  it("keeps a live boost above every unboosted listing", () => {
    const live = item("live", "premium", "2026-10-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    const newest = item("newest", "none", null, "2026-09-26T00:00:00.000Z");
    const ranked = rankWithBoosts([newest, live], 10, NOW);
    expect(ranked.map((p) => p.id)).toEqual(["live", "newest"]);
  });

  it("orders live boosts by the longest remaining boost", () => {
    const short = item("short", "featured", "2026-09-28T00:00:00.000Z", "2026-09-01T00:00:00.000Z");
    const long = item("long", "premium", "2026-10-04T00:00:00.000Z", "2026-09-02T00:00:00.000Z");
    expect(rankWithBoosts([short, long], 10, NOW).map((p) => p.id)).toEqual(["long", "short"]);
  });

  it("falls back to newest first for organic posts", () => {
    const a = item("a", "none", null, "2026-09-10T00:00:00.000Z");
    const b = item("b", "none", null, "2026-09-20T00:00:00.000Z");
    const c = item("c", "none", null, "2026-09-15T00:00:00.000Z");
    expect(rankWithBoosts([a, b, c], 10, NOW).map((p) => p.id)).toEqual(["b", "c", "a"]);
  });

  it("treats a missing or unparseable expiry as unboosted, never as a live boost", () => {
    // A boost we cannot date is not one we can advertise, so these must sink
    // into the organic group and be ranked purely by recency — the opposite of
    // how the raw boost_until column would treat the past/"not-a-date" value.
    const noExpiry = item("noexp", "featured", null, "2026-09-20T00:00:00.000Z");
    const badExpiry = item("bad", "featured", "not-a-date", "2026-09-21T00:00:00.000Z");
    const organic = item("org", "none", null, "2026-09-01T00:00:00.000Z");
    const live = item("live", "featured", "2026-10-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");

    const ranked = rankWithBoosts([organic, noExpiry, badExpiry, live], 10, NOW);
    // live first, then the rest by recency regardless of their boost_tier.
    expect(ranked.map((p) => p.id)).toEqual(["live", "bad", "noexp", "org"]);
  });

  it("applies the page size after re-ranking", () => {
    const live = item("live", "featured", "2026-10-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z");
    const many = [live, ...["a", "b", "c"].map((id) => item(id, "none", null, "2026-09-20T00:00:00.000Z"))];
    const ranked = rankWithBoosts(many, 2, NOW);
    expect(ranked.map((p) => p.id)).toEqual(["live", "a"]);
  });

  it("does not mutate the array it was given", () => {
    const input = [
      item("b", "none", null, "2026-09-10T00:00:00.000Z"),
      item("a", "featured", "2026-10-01T00:00:00.000Z", "2026-01-01T00:00:00.000Z"),
    ];
    rankWithBoosts(input, 10, NOW);
    expect(input.map((p) => p.id)).toEqual(["b", "a"]);
  });
});
