import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Contract test for the volunteer program migrations (Phases A–F).
 * Asserts the committed SQL contains every object the UI depends on, so a
 * broken/renamed table, policy or trigger fails loudly in CI instead of as a
 * blank page in production. Pure file assertions — no DB, no network.
 */

const M = (name: string) =>
  readFileSync(
    path.resolve(process.cwd(), "supabase/migrations", name),
    "utf8",
  ).replace(/\r\n/g, "\n");

describe("volunteer program schema contract", () => {
  it("Phase A wires course covers end to end", () => {
    const s = M("20260928000000_course_covers.sql");
    expect(s).toContain("add column if not exists cover_url");
    expect(s).toContain("values ('course-media', 'course-media', true)");
    expect(s).toContain("course_media_read_public");
    expect(s).toContain("course_media_insert_admin");
    // cover_url must be appended LAST in the view select: CREATE OR REPLACE
    // VIEW matches columns by position (42P16 otherwise).
    const view = s.slice(s.indexOf("create or replace view public.courses_public"));
    expect(view).toMatch(/count\(l\.id\)::int as lesson_count,\n\s*c\.cover_url\n/);
    expect(s).toContain("security_invoker = true");
  });

  it("Phase B creates the application pipeline with ID, photo and probation", () => {
    const s = M("20260928000001_volunteer_applications.sql");
    expect(s).toContain("create table if not exists public.volunteer_applications");
    expect(s).toContain("probation_ends_at timestamptz");
    expect(s).toContain("terms_version");
    expect(s).toContain("id_type");
    expect(s).toContain("id_number");
    expect(s).toContain("photo_url");
    expect(s).toContain("volunteer_applications_insert_self");
    expect(s).toContain("volunteer_applications_admin_all");
    expect(s).toContain("values ('member-media', 'member-media', true)");
    expect(s).toContain("interval '30 days'");
    expect(s).toContain("trg_volunteer_application_events");
  });

  it("Phase C maintains the public team roster from approvals", () => {
    const s = M("20260928000002_volunteer_team.sql");
    expect(s).toContain("create table if not exists public.team_members");
    expect(s).toContain("team_members_read_public");
    expect(s).toContain("trg_volunteer_team_sync");
    expect(s).toContain("on conflict (member_id) do update");
  });

  it("Phase D flags org roles and rewrites copy to unpaid claim flow", () => {
    const s = M("20260928000003_org_roles_volunteer.sql");
    expect(s).toContain("'{\"org_role\": true}'");
    expect(s).toContain("Unpaid volunteer role");
    expect(s).toContain("claim this role on the Volunteer page");
  });

  it("Phase E creates the performance ledger with XP and notifications", () => {
    const s = M("20260928000004_volunteer_performance.sql");
    for (const table of ["volunteer_tasks", "volunteer_hours", "volunteer_reviews"]) {
      expect(s).toContain(`create table if not exists public.${table}`);
    }
    expect(s).toContain("trg_volunteer_task_done_xp");
    expect(s).toContain("trg_volunteer_hours_xp");
    expect(s).toContain("trg_volunteer_review_events");
    expect(s).toContain("trg_volunteer_confirmation_badge");
    expect(s).toContain("'Probation Passed'");
    expect(s).toContain("'Star Volunteer'");
    expect(s).toContain("insert into public.notifications");
  });

  it("In-kind offers table is open for gifts and closed for reads", () => {
    const s = M("20260929000000_inkind_offers.sql");
    expect(s).toContain("create table if not exists public.inkind_offers");
    for (const category of [
      "devices",
      "connectivity",
      "skills",
      "visibility",
      "hosting",
      "venue",
      "other",
    ]) {
      expect(s).toContain(`'${category}'`);
    }
    expect(s).toContain("inkind_offers_insert_open");
    expect(s).toContain("for insert to anon, authenticated");
    expect(s).toContain("inkind_offers_select_own_or_admin");
    expect(s).toContain("inkind_offers_admin_write");
  });
});
