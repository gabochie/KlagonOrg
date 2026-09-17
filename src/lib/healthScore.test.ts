import { describe, it, expect } from "vitest";
import {
  HEALTH_AREAS,
  computeHealthScore,
  type HealthInputs,
} from "./healthScore";

function full(overrides: Partial<HealthInputs> = {}): HealthInputs {
  const base: HealthInputs = {
    google_visibility: 1,
    website: 1,
    social_presence: 1,
    customer_conversion: 1,
    reviews_reputation: 1,
    ecommerce: 1,
    whatsapp_sales: 1,
    ai_readiness: 1,
    automation: 1,
    data_analytics: 1,
  };
  return { ...base, ...overrides };
}

describe("KLAGON Instant Digital Health Score kernel", () => {
  it("returns a perfect 100 when every area is graded 1", () => {
    const r = computeHealthScore(full());
    expect(r.overall).toBe(100);
    // no gaps -> no recommendations
    expect(r.recommendations).toHaveLength(0);
  });

  it("returns 0 when every area is graded 0", () => {
    const r = computeHealthScore(full({
      google_visibility: 0, website: 0, social_presence: 0,
      customer_conversion: 0, reviews_reputation: 0, ecommerce: 0,
      whatsapp_sales: 0, ai_readiness: 0, automation: 0, data_analytics: 0,
    }));
    expect(r.overall).toBe(0);
  });

  it("gives a fully-digital Google visibility its full 15 points", () => {
    const r = computeHealthScore(full({ google_visibility: 1 }));
    // Only-area contribution: 1.0 * 0.15 * 100 = 15
    expect(r.overall).toBe(15);
  });

  it("gives WhatsApp presence exactly 12 points (weight 0.12, spec 2.02)", () => {
    const r = computeHealthScore(full({ whatsapp_sales: 1 }));
    expect(r.overall).toBe(12);
  });

  it("ranks the biggest weighted gap as the #1 recommendation", () => {
    // Lose Google visibility (weight .15) but keep everything else:
    const r = computeHealthScore(full({ google_visibility: 0 }));
    expect(r.recommendations[0].areaId).toBe("google_visibility");
    expect(r.recommendations[0].gapPct).toBeGreaterThanOrEqual(r.recommendations[1]?.gapPct ?? 0);
  });

  it("caps recommendations at 3 and orders by gap descending", () => {
    const r = computeHealthScore(full({
      google_visibility: 0, whatsapp_sales: 0.2, website: 0.4,
      social_presence: 0.5, data_analytics: 0.1,
    }));
    expect(r.recommendations.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < r.recommendations.length; i++) {
      expect(r.recommendations[i - 1].gapPct).toBeGreaterThanOrEqual(r.recommendations[i].gapPct);
    }
  });

  it("clamps out-of-range grades instead of returning NaN", () => {
    const r = computeHealthScore(full({ google_visibility: 5 as never, social_presence: -1 as never }));
    expect(Number.isNaN(r.overall)).toBe(false);
    expect(r.overall).toBeGreaterThanOrEqual(0);
    expect(r.overall).toBeLessThanOrEqual(100);
  });

  it("is deterministic: same inputs -> same score and recommendations", () => {
    const inputs = full({ google_visibility: 0.3, whatsapp_sales: 0.7, ecommerce: 0 });
    const a = computeHealthScore(inputs);
    const b = computeHealthScore(inputs);
    expect(a).toEqual(b);
  });

  it("weights sum to exactly 100 (spec 2.02 rubric integrity)", () => {
    const sum = HEALTH_AREAS.reduce((s, a) => s + a.weight * 100, 0);
    expect(sum).toBeCloseTo(100, 2);
  });
});
