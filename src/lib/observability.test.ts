import { describe, it, expect } from "vitest";
import { cfBeaconToken, buildErrorPayload } from "./observability";

describe("observability helpers", () => {
  it("accepts plausible beacon tokens, rejects blanks", () => {
    expect(cfBeaconToken("a1b2c3d4e5f6")).toBe("a1b2c3d4e5f6");
    expect(cfBeaconToken("  ")).toBeNull();
    expect(cfBeaconToken("short")).toBeNull();
  });

  it("builds a bounded payload from Errors and unknowns", () => {
    const err = new Error("boom");
    const p = buildErrorPayload(err);
    expect(p.message).toBe("boom");
    expect(typeof p.stack === "string" || p.stack === null).toBe(true);

    const q = buildErrorPayload("plain string failure");
    expect(q.message).toBe("plain string failure");
    expect(q.stack).toBeNull();

    const long = buildErrorPayload(new Error("x".repeat(5000)));
    expect(long.message.length).toBeLessThanOrEqual(1000);
  });
});