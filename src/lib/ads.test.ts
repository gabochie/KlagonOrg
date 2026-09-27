import { describe, expect, it } from "vitest";
import {
  AD_SLOTS,
  hasSeenPlacement,
  isAdFreeRoute,
  isFirstPartyAdRouteAllowed,
  isThirdPartyAdRouteAllowed,
  matchSponsors,
  normalizePath,
  withPlacementSeen,
  type SponsoredPlacement,
} from "./ads";

describe("normalizePath", () => {
  it("always yields a leading slash and no trailing slash", () => {
    expect(normalizePath("/blog/")).toBe("/blog");
    expect(normalizePath("blog")).toBe("/blog");
    expect(normalizePath("/blog?x=1#top")).toBe("/blog");
    expect(normalizePath("")).toBe("/");
    expect(normalizePath(undefined)).toBe("/");
    expect(normalizePath("/")).toBe("/");
  });
});

describe("isAdFreeRoute", () => {
  it("bars money, forms, teaching and private screens", () => {
    for (const p of [
      "/donate",
      "/donate/",
      "/sponsor",
      "/submit",
      "/coming-soon",
      "/404",
      "/auth/login",
      "/auth/register",
      "/dashboard/admin/inbox",
      "/dashboard/member",
      "/my/business",
      "/learning/cbdfface-25dc-4756-a84e-eaec6dfc570e",
      "/learning/klagon-college",
      "/people/2b159299-08c2-450c-bfb6-1aa43608d3fc",
      "/tools/health-score",
      "/visit/stay",
      "/forum/ask",
      "/volunteer/apply",
    ]) {
      expect(isAdFreeRoute(p), p).toBe(true);
    }
  });

  it("allows advertising on the commercial and editorial surfaces", () => {
    for (const p of ["/", "/blog", "/news", "/jobs", "/classifieds", "/radio", "/sponsors"]) {
      expect(isAdFreeRoute(p), p).toBe(false);
    }
  });

  it("does not let a prefix leak onto a sibling route", () => {
    // /sponsor (the form) is ad-free while /sponsors (the wall) may carry ads.
    expect(isAdFreeRoute("/sponsor")).toBe(true);
    expect(isAdFreeRoute("/sponsors")).toBe(false);
    expect(isAdFreeRoute("/sponsor/apply")).toBe(true);
  });
});

describe("isThirdPartyAdRouteAllowed", () => {
  it("fails closed: the directory and map are never allowed", () => {
    // 740 auto-imported listings with templated meta descriptions are the
    // low-value-content pattern that risks a domain-wide policy action.
    expect(isThirdPartyAdRouteAllowed("/directory/rhino-pharmacy")).toBe(false);
    expect(isThirdPartyAdRouteAllowed("/directory")).toBe(false);
    expect(isThirdPartyAdRouteAllowed("/business")).toBe(false);
    expect(isThirdPartyAdRouteAllowed("/business/klagon-community-bakery")).toBe(false);
    expect(isThirdPartyAdRouteAllowed("/map/klagon-police-station")).toBe(false);
  });

  it("allows editorial and listing pages that carry real content", () => {
    for (const p of [
      "/",
      "/blog/protect-yourself-online-ghana-scam-guide",
      "/blog/category/thinking-skills",
      "/news",
      "/events",
      "/jobs",
      "/classifieds/properties",
      "/radio",
      "/sponsors",
    ]) {
      expect(isThirdPartyAdRouteAllowed(p), p).toBe(true);
    }
  });

  it("never overrides the ad-free list", () => {
    expect(isThirdPartyAdRouteAllowed("/donate")).toBe(false);
    expect(isThirdPartyAdRouteAllowed("/dashboard/member")).toBe(false);
    expect(isThirdPartyAdRouteAllowed("/learning/klagon-college")).toBe(false);
  });

  it("does not treat the root entry as a catch-all prefix", () => {
    expect(isThirdPartyAdRouteAllowed("/")).toBe(true);
    expect(isThirdPartyAdRouteAllowed("/anything-else")).toBe(false);
  });
});

describe("isFirstPartyAdRouteAllowed", () => {
  it("keeps our own sponsored inventory off payment and task screens", () => {
    expect(isFirstPartyAdRouteAllowed("/donate")).toBe(false);
    expect(isFirstPartyAdRouteAllowed("/learning/cbdfface-25dc-4756-a84e-eaec6dfc570e")).toBe(false);
    expect(isFirstPartyAdRouteAllowed("/dashboard/admin/sponsors")).toBe(false);
  });

  it("allows sponsored directory inventory, which is the main sellable asset", () => {
    expect(isFirstPartyAdRouteAllowed("/directory/rhino-pharmacy")).toBe(true);
    expect(isFirstPartyAdRouteAllowed("/business")).toBe(true);
  });
});

describe("matchSponsors", () => {
  const sponsor = (
    name: string,
    categories: string[],
    tagline: string | null = null,
  ): SponsoredPlacement => ({
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    tier: "growth",
    tagline,
    logoUrl: null,
    categories,
    whatsapp: null,
    phone: null,
  });

  const bakery = sponsor("Klagon Community Bakery", ["Bakery"], "Fresh bread daily");
  const engineer = sponsor("Afram Plains Engineering", ["Construction"]);

  it("keeps every sponsor when the reader has not filtered", () => {
    expect(matchSponsors([bakery, engineer])).toEqual([bakery, engineer]);
    expect(matchSponsors([bakery, engineer], { term: "  " })).toEqual([bakery, engineer]);
  });

  it("matches on name, tagline and categories", () => {
    expect(matchSponsors([bakery, engineer], { term: "bakery" })).toEqual([bakery]);
    expect(matchSponsors([bakery, engineer], { term: "fresh bread" })).toEqual([bakery]);
    expect(matchSponsors([bakery, engineer], { term: "engineering" })).toEqual([engineer]);
  });

  it("is case and whitespace insensitive", () => {
    expect(matchSponsors([bakery], { term: "  COMMUNITY   BAKERY " })).toEqual([bakery]);
  });

  it("never shows a sponsor unrelated to the search", () => {
    expect(matchSponsors([bakery, engineer], { term: "plumber" })).toEqual([]);
  });

  it("matches categories loosely in both directions", () => {
    expect(matchSponsors([bakery], { category: "Bakeries" })).toEqual([bakery]);
    expect(matchSponsors([sponsor("Shop", ["Bakeries & Confectioneries"])], { category: "Bakery" })).toEqual([
      sponsor("Shop", ["Bakeries & Confectioneries"]),
    ]);
    expect(matchSponsors([bakery, engineer], { category: "Construction" })).toEqual([engineer]);
  });

  it("requires both filters to match when both are given", () => {
    const pool = [bakery, engineer, sponsor("Bakery Plus", ["Bakery"])];
    expect(matchSponsors(pool, { term: "bakery", category: "construction" })).toEqual([]);
    expect(matchSponsors(pool, { term: "bakery", category: "bakery" })).toHaveLength(2);
  });
});

describe("impression de-duplication", () => {
  // The bug this guards: a slot holding several paid placements. Keying the
  // session on the slot alone credited only the first sponsor and silently
  // dropped the rest, so they could be clicked but never prove a view.
  const SLOT = "directory-sponsored";

  it("treats an empty session as unseen", () => {
    expect(hasSeenPlacement([], SLOT)).toBe(false);
  });

  it("credits each sponsor in a shared slot independently", () => {
    let seen: string[] = [];
    const slots = ["a", "b", "c"].map((slug) => `${SLOT}:${slug}`);

    const counted = slots.filter((key) => {
      if (hasSeenPlacement(seen, key)) return false;
      seen = withPlacementSeen(seen, key);
      return true;
    });

    expect(counted).toEqual(slots);
    expect(seen).toEqual(slots);
  });

  it("counts a sponsor once per session, not once per scroll", () => {
    let seen: string[] = [];
    const key = `${SLOT}:afram`;
    for (let view = 0; view < 5; view++) {
      if (!hasSeenPlacement(seen, key)) seen = withPlacementSeen(seen, key);
    }
    expect(seen).toEqual([key]);
  });

  it("does not let one sponsor's view consume another's", () => {
    let seen: string[] = [];
    seen = withPlacementSeen(seen, `${SLOT}:a`);
    expect(hasSeenPlacement(seen, `${SLOT}:b`)).toBe(false);
  });

  it("preserves earlier keys and does not mutate its input", () => {
    const before = ["radio-top"];
    const after = withPlacementSeen(before, "business-sponsored");
    expect(before).toEqual(["radio-top"]);
    expect(after).toEqual(["radio-top", "business-sponsored"]);
  });
});

describe("AD_SLOTS", () => {
  it("has no duplicates", () => {
    expect(new Set(AD_SLOTS).size).toBe(AD_SLOTS.length);
  });
});
