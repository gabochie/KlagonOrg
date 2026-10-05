import { describe, it, expect } from "vitest";
import { resolveCourseCover, resolveCourseOg, templateKey } from "./courseCover";

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

describe("resolveCourseOg", () => {
  it("appends -og.jpg to an authored base path", () => {
    expect(resolveCourseOg({ cover_url: "/brand/learning/SOE-VEN-01" })).toBe(
      "/brand/learning/SOE-VEN-01-og.jpg",
    );
  });

  it("tolerates a trailing slash", () => {
    expect(resolveCourseOg({ coverUrl: "/brand/learning/SOT-IT-04/" })).toBe(
      "/brand/learning/SOT-IT-04-og.jpg",
    );
  });

  it("uses an already-sized upload verbatim", () => {
    const url = "https://x.supabase.co/storage/v1/object/public/course-media/c/cover.jpg";
    expect(resolveCourseOg({ cover_url: url })).toBe(url);
  });

  it("returns null when there is no authored cover, so callers can use the site banner", () => {
    expect(resolveCourseOg({})).toBeNull();
    expect(resolveCourseOg({ cover_url: null })).toBeNull();
    expect(resolveCourseOg({ cover_url: "  " })).toBeNull();
  });

  it("never returns a template path (templates are unlabelled gradients)", () => {
    expect(resolveCourseOg({ school: "CCC" })).toBeNull();
    expect(resolveCourseOg({ category: "Career" })).toBeNull();
  });

  it("resolves an OG image for every committed authored cover", () => {
    const TOKENS = [
      "SOT-AI-01",
      "CCC-FIN-01",
      "CCC-LEA-01",
      "SOE-VEN-01",
      "CCC-COM-01",
      "CCC-CAR-01",
      "SOT-IT-01",
      "SOT-IT-02",
      "SOT-IT-03",
      "SOT-IT-04",
    ];
    for (const token of TOKENS) {
      const base = `/brand/learning/${token}`;
      expect(resolveCourseOg({ cover_url: base })).toBe(`${base}-og.jpg`);
      expect(resolveCourseCover({ cover_url: base }, 600)).toBe(`${base}-600.webp`);
      expect(resolveCourseCover({ cover_url: base }, 1200)).toBe(`${base}-1200.webp`);
    }
  });
});
