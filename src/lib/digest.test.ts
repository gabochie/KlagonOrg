import { describe, it, expect } from "vitest";
import { buildSponsorDigest, buildAuthorDigest, buildDigestLink } from "./digest";

describe("digest kernel", () => {
  it("builds a sponsor digest with reviews, replies needed, and photo nudge", () => {
    const m = buildSponsorDigest({
      businessName: "APOG Klagon",
      reviewsTotal: 3,
      reviewsAvg: 4.5,
      unrepliedCount: 2,
      photosCount: 0,
    });
    expect(m).toContain("APOG Klagon");
    expect(m).toContain("4.5/5");
    expect(m).toContain("2 reviews need");
    expect(m).toContain("photos");
    expect(m).toContain("STOP");
  });

  it("handles empty states honestly", () => {
    const m = buildSponsorDigest({
      businessName: "X",
      reviewsTotal: 0,
      reviewsAvg: null,
      unrepliedCount: 0,
      photosCount: 4,
    });
    expect(m).toContain("No reviews yet");
    expect(m).not.toContain("photos");
  });

  it("builds an author digest with views and pending", () => {
    const m = buildAuthorDigest({
      displayName: "Ama",
      approvedPosts: 2,
      totalViews: 47,
      pendingPosts: 1,
    });
    expect(m).toContain("2 approved posts");
    expect(m).toContain("47 total views");
    expect(m).toContain("1 still in review");
  });

  it("builds encoded wa.me links", () => {
    expect(buildDigestLink("0244 000 000", "Hi there")).toBe(
      "https://wa.me/233244000000?text=Hi%20there"
    );
  });
});
