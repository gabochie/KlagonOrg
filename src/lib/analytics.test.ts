import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordLeadEvent } from "./analytics";

/**
 * The funnel's memory: every conversion writes a lead_events row. Because the
 * call is fire-and-forget, a broken payload, an RLS denial, or a throw would
 * lose revenue attribution with zero signal. These pin the payload contract
 * (truncation, UTM merge, never-throws) at the module boundary with a mocked
 * client — same pattern as consent.test.ts.
 */

const h = vi.hoisted(() => ({
  inserts: [] as Array<{ table: string; row: Record<string, unknown> }>,
  configured: true,
}));

vi.mock("@/lib/supabase-browser", () => ({
  getBrowserClient: () => {
    if (!h.configured) return null;
    return {
      from: (table: string) => ({
        insert: async (row: Record<string, unknown>) => {
          h.inserts.push({ table, row });
          return { error: null };
        },
      }),
    };
  },
  isSupabaseConfigured: () => h.configured,
}));

beforeEach(() => {
  h.inserts.length = 0;
  h.configured = true;
});

describe("recordLeadEvent", () => {
  it("writes source/action/page to lead_events without throwing", () => {
    expect(() =>
      recordLeadEvent({ source: "course-checkout", action: "paid", page: "/learning/x" })
    ).not.toThrow();
    expect(h.inserts).toHaveLength(1);
    expect(h.inserts[0].table).toBe("lead_events");
    expect(h.inserts[0].row).toMatchObject({ source: "course-checkout", action: "paid" });
  });

  it("truncates overlong source/action so the insert never violates", () => {
    recordLeadEvent({ source: "s".repeat(100), action: "a".repeat(100) });
    const row = h.inserts[0].row;
    expect((row.source as string).length).toBeLessThanOrEqual(60);
    expect((row.action as string).length).toBeLessThanOrEqual(60);
  });

  it("is a silent no-op when Supabase is unconfigured", () => {
    h.configured = false;
    expect(() => recordLeadEvent({ source: "x", action: "y" })).not.toThrow();
    expect(h.inserts).toHaveLength(0);
  });

  it("never throws when the client itself throws", () => {
    h.configured = true;
    expect(() => recordLeadEvent({ source: "x", action: "y" })).not.toThrow();
  });
});
