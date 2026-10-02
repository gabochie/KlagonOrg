import { describe, it, expect } from "vitest";
import { resolveCourseCover, templateKey } from "./courseCover";

describe("resolveCourseCover", () => {
  it("appends the size suffix to an authored base path", () => {
    expect(resolveCourseCover({ coverUrl: "/brand/learning/SOE-VEN-01" })).toBe(
      "/brand/learning/SOE-VEN-01-600.webp",
    );
    expect(resolveCourseCover({ coverUrl: "/brand/learning/SOE-VEN-01" }, 1200)).toBe(
      "/brand/learning/SOE-VEN-01-1200.webp",
    );
  });

  it("tolerates a trailing slash on the authored base path", () => {
    expect(resolveCourseCover({ coverUrl: "/brand/learning/SOE-VEN-01/" })).toBe(
      "/brand/learning/SOE-VEN-01-600.webp",
    );
  });

  it("uses an uploaded file URL verbatim (already sized)", () => {
    const url = "https://x.supabase.co/storage/v1/object/public/course-media/courses/1/cover.webp";
    expect(resolveCourseCover({ coverUrl: url }, 1200)).toBe(url);
  });

  it("prefers coverUrl over the catalogue cover alias", () => {
    expect(
      resolveCourseCover({ coverUrl: "/brand/learning/SOE-VEN-01", cover: "/brand/learning/OLD" }),
    ).toBe("/brand/learning/SOE-VEN-01-600.webp");
  });

  it("reads the catalogue cover field directly", () => {
    expect(resolveCourseCover({ cover: "/brand/learning/SOE-VEN-01" })).toBe(
      "/brand/learning/SOE-VEN-01-600.webp",
    );
  });

  it("reads the DB snake_case cover_url field", () => {
    expect(resolveCourseCover({ cover_url: "/brand/learning/SOE-VEN-01" }, 1200)).toBe(
      "/brand/learning/SOE-VEN-01-1200.webp",
    );
    const url = "https://x.supabase.co/storage/v1/object/public/course-media/c/cover.webp";
    expect(resolveCourseCover({ cover_url: url }, 1200)).toBe(url);
  });

  it("picks a branded template by school", () => {
    expect(resolveCourseCover({ school: "SOE" }, 1200)).toBe(
      "/brand/learning/templates/soe-1200.webp",
    );
    expect(resolveCourseCover({ school: "soa" })).toBe("/brand/learning/templates/soa-600.webp");
  });

  it("falls back to a category template when no school is known", () => {
    expect(resolveCourseCover({ category: "Entrepreneurship" })).toBe(
      "/brand/learning/templates/soe-600.webp",
    );
    expect(resolveCourseCover({ category: "Career" }, 1200)).toBe(
      "/brand/learning/templates/sod-1200.webp",
    );
  });

  it("always resolves to a path (never empty) for an unknown course", () => {
    expect(resolveCourseCover({})).toBe("/brand/learning/templates/generic-600.webp");
    expect(resolveCourseCover({ school: "ZZZ", category: "Nope" })).toBe(
      "/brand/learning/templates/generic-600.webp",
    );
  });
});

describe("templateKey", () => {
  it("maps every school to its own template", () => {
    expect(templateKey({ school: "CCC" })).toBe("ccc");
    expect(templateKey({ school: "SOT" })).toBe("sot");
    expect(templateKey({ school: "SOE" })).toBe("soe");
    expect(templateKey({ school: "SOD" })).toBe("sod");
    expect(templateKey({ school: "SOA" })).toBe("soa");
  });
});
