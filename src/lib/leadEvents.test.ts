import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Contract test for conversion telemetry (lead-gen Phase 1).
 * The whole funnel depends on this table + policies existing exactly so.
 * Pure file assertions — no DB, no network.
 */

const SQL_PATH = path.resolve(
  process.cwd(),
  "supabase/migrations/20260929000001_lead_events.sql",
);

function sql(): string {
  return readFileSync(SQL_PATH, "utf8").replace(/\r\n/g, "\n");
}

describe("lead_events telemetry contract", () => {
  it("creates the table with source/action/page/metadata shape", () => {
    const s = sql();
    expect(s).toContain("create table if not exists public.lead_events");
    for (const col of ["member_id", "source", "action", "page", "metadata"]) {
      expect(s).toContain(col);
    }
    expect(s).toContain("lead_events_source_action_idx");
  });

  it("lets anyone record and only owners/admins read", () => {
    const s = sql();
    expect(s).toContain("lead_events_insert_open");
    expect(s).toContain("for insert to anon, authenticated");
    expect(s).toContain("lead_events_select_own_or_admin");
  });
});
