import { describe, it, expect } from "vitest";
import { sentryDsn, cfBeaconToken, sentryEnvironment } from "./observability";

describe("observability env helpers", () => {
  it("accepts only well-formed Sentry DSNs", () => {
    expect(sentryDsn("https://abc123@o123456.ingest.sentry.io/789")).toBe(
      "https://abc123@o123456.ingest.sentry.io/789"
    );
    expect(sentryDsn("")).toBeNull();
    expect(sentryDsn("not-a-dsn")).toBeNull();
    expect(sentryDsn("https://abc123@o123456.ingest.sentry.io/")).toBeNull();
  });

  it("accepts plausible beacon tokens, rejects blanks", () => {
    expect(cfBeaconToken("a1b2c3d4e5f6")).toBe("a1b2c3d4e5f6");
    expect(cfBeaconToken("  ")).toBeNull();
    expect(cfBeaconToken("short")).toBeNull();
  });

  it("falls back to a sane environment name", () => {
    expect(sentryEnvironment("staging")).toBe("staging");
    expect(["development", "production"]).toContain(sentryEnvironment(""));
  });
});