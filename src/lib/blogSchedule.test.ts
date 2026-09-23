import { describe, expect, it, vi, afterEach } from "vitest";
import { isPostPublished, todayIso, ISO_DAY_RE } from "@/lib/blogSchedule";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("todayIso", () => {
  it("returns YYYY-MM-DD matching ISO_DAY_RE", () => {
    expect(ISO_DAY_RE.test(todayIso())).toBe(true);
  });
});

describe("isPostPublished", () => {
  it("publishes posts without a status by default (pre-dated backlog)", () => {
    expect(isPostPublished({ date: "2999-01-01" })).toBe(true);
    expect(isPostPublished({ date: "2020-01-01" })).toBe(true);
  });

  it("excludes files without a valid YYYY-MM-DD date (e.g. README.md)", () => {
    expect(isPostPublished({})).toBe(false);
    expect(isPostPublished({ date: "" })).toBe(false);
    expect(isPostPublished({ date: "not-a-date" })).toBe(false);
    expect(isPostPublished({ date: "2026/09/23" })).toBe(false);
  });

  it("shows a scheduled post on or before its date", () => {
    expect(isPostPublished({ status: "scheduled", date: "2020-01-01" })).toBe(true);
    expect(isPostPublished({ status: "scheduled", date: todayIso() })).toBe(true);
  });

  it("hides a scheduled post until its date arrives", () => {
    expect(isPostPublished({ status: "scheduled", date: "2999-01-01" })).toBe(false);
  });

  it("hides a scheduled post with a missing or malformed date", () => {
    expect(isPostPublished({ status: "scheduled" })).toBe(false);
    expect(isPostPublished({ status: "scheduled", date: "" })).toBe(false);
    expect(isPostPublished({ status: "scheduled", date: "not-a-date" })).toBe(false);
  });
});