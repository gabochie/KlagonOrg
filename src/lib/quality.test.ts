import { describe, it, expect } from "vitest";
import {
  QUALITY_AREAS,
  checkId,
  overallProgress,
  areaProgress,
  unitGaps,
  totalManualChecks,
} from "./quality";

describe("quality inventory", () => {
  it("has unique area ids and non-empty checklists", () => {
    const ids = QUALITY_AREAS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of QUALITY_AREAS) {
      expect(a.name.trim().length).toBeGreaterThan(0);
      expect(a.manual.length).toBeGreaterThan(0);
      for (const m of a.manual) expect(m.trim().length).toBeGreaterThan(0);
    }
  });

  it("every check id is unique across areas", () => {
    const ids = QUALITY_AREAS.flatMap((a) => a.manual.map((_, i) => checkId(a.id, i)));
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(totalManualChecks());
  });

  it("computes progress honestly", () => {
    expect(overallProgress({})).toBe(0);
    const all: Record<string, boolean> = {};
    QUALITY_AREAS.forEach((a) => a.manual.forEach((_, i) => (all[checkId(a.id, i)] = true)));
    expect(overallProgress(all)).toBe(100);
    expect(areaProgress(QUALITY_AREAS[0], {})).toBe(0);
  });

  it("exposes the unit-test backlog", () => {
    const gaps = unitGaps();
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps.every((a) => a.unit.length === 0)).toBe(true);
  });
});
