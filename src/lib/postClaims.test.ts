import { describe, it, expect } from "vitest";
import {
  validateClaimPhone,
  totalImages,
  imageSlotsLeft,
  MAX_IMAGES_TOTAL,
  MAX_GALLERY,
} from "./postClaims";

describe("postClaims", () => {
  it("caps total images at 3 (cover + 2 gallery)", () => {
    expect(MAX_IMAGES_TOTAL).toBe(3);
    expect(MAX_GALLERY).toBe(2);
    expect(totalImages("https://x/y.jpg", ["a", "b"])).toBe(3);
    expect(imageSlotsLeft("https://x/y.jpg", ["a", "b"])).toBe(0);
    expect(imageSlotsLeft(null, ["a"])).toBe(2);
    expect(imageSlotsLeft(null, [])).toBe(3);
  });

  it("validates the advert number strictly", () => {
    expect(validateClaimPhone("024 123 4567")).toBe("233241234567");
    expect(validateClaimPhone("+233241234567")).toBe("233241234567");
    expect(validateClaimPhone("abc")).toContain("original advert");
    expect(validateClaimPhone("")).toContain("original advert");
    expect(validateClaimPhone("123")).toContain("original advert");
  });
});
