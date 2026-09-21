/**
 * KLAGON quality inventory — the single source of truth for "what is tested".
 *
 * Exhaustive testing grows in layers; this kernel tracks all of them:
 *   unit        — vitest kernels in src/lib (fast, run on every commit)
 *   integration — Supabase RLS/RPC behaviour (SQL probes, run pre-release)
 *   e2e         — Playwright flows (planned; specs listed per area)
 *   manual      — human checklists below, signed off in Super Admin
 *   security    — header/XSS/dependency probes (run pre-release)
 *
 * Rule of the road: every new feature adds its unit tests AND its manual
 * checklist items here in the same commit. The Super Admin Quality Center
 * renders this file — coverage can never silently rot.
 */

export type TestLayer = "unit" | "integration" | "e2e" | "manual" | "security";

export interface QualityArea {
  id: string;
  name: string;
  scope: string;
  /** Existing vitest files covering this area (empty = gap, add tests). */
  unit: string[];
  /** Planned Playwright specs for this area. */
  e2e: string[];
  /** Human checks, done in order, top is most critical. */
  manual: string[];
}

export const QUALITY_AREAS: QualityArea[] = [
  {
    id: "auth-roles",
    name: "Auth & three dashboards",
    scope: "Login routing, RequireAdmin/Super guards, sidebar/topbar roles",
    unit: [],
    e2e: ["member-login.spec", "admin-login.spec", "super-login.spec", "guard-redirects.spec"],
    manual: [
      "Member login lands on /dashboard/member, sees no admin menu",
      "Admin login lands on /dashboard/admin, sees no Super/Platform menu",
      "Super login lands on /dashboard/super, sees 👑 menu + SUPER badge",
      "Direct URL to /dashboard/super as admin bounces to /dashboard",
      "Direct URL to /dashboard/admin as member bounces to /dashboard",
      "Logged-out visit to any dashboard bounces to login",
      "Demote/promote a test account in Roles; landing changes on next login",
    ],
  },
  {
    id: "roles-rpc",
    name: "Role split enforcement",
    scope: "set_member_role RPC, restrictive policy, last-super-admin guard",
    unit: [],
    e2e: [],
    manual: [
      "Run SQL probe: set_member_role as plain admin must raise 'super admin only'",
      "Direct UPDATE profiles SET role as admin must fail (restrictive policy)",
      "Ordinary profile edit (name) as member still succeeds",
      "Demoting the only super_admin raises 'cannot demote the last super admin'",
      "Changing own role raises 'cannot change your own role'",
    ],
  },
  {
    id: "culture-hub",
    name: "The Culture Hub",
    scope: "/culture page, festival calendar, tribal fairness copy, tags",
    unit: [],
    e2e: ["culture-hub.spec"],
    manual: [
      "/culture loads with hero, featured, events, stories, creatives, festival calendar",
      "All 8 festivals show correct people + timing",
      "RSVP toggles for signed-in member; sign-in prompt for guests",
      "Failed RSVP shows notice and button reverts",
      "Empty state (no culture rows) shows propose/write CTAs",
      "Copy names Ga-Dangme custodianship + all peoples fairly",
    ],
  },
  {
    id: "outreach",
    name: "Outreach + WA auto-sender",
    scope: "Gating kernel, queue UI, batch export/import, browser extension",
    unit: ["src/lib/outreach.test.ts"],
    e2e: ["outreach-export-import.spec"],
    manual: [
      "Upload CSV: verified+consent rows sendable, rest quarantined with reasons",
      "STOP number never appears in any queue",
      "Export auto-batch contains gated rows only, with STOP footer in text",
      "Extension dry run opens chats, sends nothing, log imports as previews",
      "Live run (≤5 test numbers): sends land, log reconciles to Supabase",
      "Per-day cap respected when one number sends (≤60)",
    ],
  },
  {
    id: "moderation",
    name: "Moderation & approvals",
    scope: "Posts/events queues, approve/reject, member resubmit",
    unit: [],
    e2e: ["submit-moderate-publish.spec"],
    manual: [
      "Member submits post → appears in moderation as pending",
      "Approve publishes it to /news; reject returns it with reason",
      "Member sees admin notes and can resubmit",
      "Event proposal with culture tags appears on /culture after approval",
    ],
  },
  {
    id: "blog-content",
    name: "Blog, SEO & feeds",
    scope: "Markdown render, sanitize, sitemap, RSS, metadata",
    unit: ["src/lib/sanitize.test.ts"],
    e2e: [],
    manual: [
      "New post renders headings, tables, links with blog styles, no raw HTML leaks",
      "Inject <script>/onerror/iframe in a draft body → stripped in output",
      "/sitemap.xml includes new public routes, excludes /dashboard/*",
      "rss.xml regenerates on build with latest posts",
      "Page titles/descriptions correct on culture, news, business pages",
    ],
  },
  {
    id: "directory-claims",
    name: "Directory & claims",
    scope: "Listings, claim flow, WhatsApp verify, map points",
    unit: ["src/lib/registryImport.test.ts", "src/lib/mapImport.test.ts", "src/lib/listingImport.test.ts"],
    e2e: ["claim-flow.spec"],
    manual: [
      "Claim starts with name + WhatsApp, listing locks as pending",
      "Staff verifies in thread; claim completes, owner can edit",
      "Duplicate claim on claimed listing is refused",
      "New map point appears on /map after approval",
    ],
  },
  {
    id: "events-rsvp",
    name: "Events & RSVP",
    scope: "Public events, RSVP counts, spots-left math",
    unit: [],
    e2e: ["rsvp.spec"],
    manual: [
      "RSVP increments count, decrements spots-left, no double count on retap",
      "Full event (0 spots left) blocks new RSVPs",
      "Past events drop off upcoming lists",
      "Member sees own RSVPs in UpcomingEvents",
    ],
  },
  {
    id: "learning",
    name: "Learning Hub",
    scope: "Courses, lessons, XP, lesson markdown sanitize",
    unit: [],
    e2e: [],
    manual: [
      "Lesson completes → XP credited once (no double on refresh)",
      "Lesson markdown renders styled, scripts stripped",
      "Locked lesson stays locked until prerequisite done",
      "Progress persists across sessions",
    ],
  },
  {
    id: "security-headers",
    name: "Security headers & XSS",
    scope: "CSP, framing, sanitizer, secrets, RLS posture",
    unit: ["src/lib/sanitize.test.ts"],
    e2e: [],
    manual: [
      "Response headers include CSP, X-Frame-Options, nosniff (check host)",
      "Submit <img onerror> in every rich-text field → stored inert, renders as text",
      "No .env.local / keys in git (git ls-files check)",
      "npm audit: no new criticals since last release",
      "Supabase advisors: no RLS errors on new tables",
    ],
  },
  {
    id: "command-center",
    name: "Command Center",
    scope: "Super-only route, iframe bridge, save/load, status chrome",
    unit: [],
    e2e: ["command-center-guard.spec"],
    manual: [
      "Admin opening /dashboard/admin/ops sees the moved notice, not the app",
      "Super opens /dashboard/super/command: shimmer → Connected pill",
      "Edit + save shows Saving… then Saved + time; reload restores state",
      "Kill network mid-save → red pill + retry card, no silent loss",
      "Full-screen toggle works; sidebar Platform menu highlights",
    ],
  },
  {
    id: "perf-a11y",
    name: "Performance & accessibility",
    scope: "Load times, mobile layout, keyboard, contrast",
    unit: [],
    e2e: [],
    manual: [
      "/culture and /news load <3s on 4G throttling",
      "No horizontal scroll at 360px on hub, dashboards, queue",
      "All buttons reachable + operable by keyboard; focus visible",
      "Images have alt text; form fields labelled",
      "Lighthouse mobile ≥90 performance on homepage",
    ],
  },
];

export const QA_STORE_KEY = "klagon.qa.v1";

export type CheckedMap = Record<string, boolean>;

export function checkId(areaId: string, index: number): string {
  return `${areaId}:${index}`;
}

/** Progress across the whole inventory (0–100). */
export function overallProgress(checked: CheckedMap): number {
  let total = 0;
  let done = 0;
  for (const a of QUALITY_AREAS) {
    a.manual.forEach((_, i) => {
      total++;
      if (checked[checkId(a.id, i)]) done++;
    });
  }
  return total === 0 ? 100 : Math.round((done / total) * 100);
}

/** Progress for one area (0–100). */
export function areaProgress(area: QualityArea, checked: CheckedMap): number {
  if (area.manual.length === 0) return 100;
  const done = area.manual.filter((_, i) => checked[checkId(area.id, i)]).length;
  return Math.round((done / area.manual.length) * 100);
}

/** Areas with zero unit coverage — the testing backlog, worst first. */
export function unitGaps(): QualityArea[] {
  return QUALITY_AREAS.filter((a) => a.unit.length === 0);
}

export function totalManualChecks(): number {
  return QUALITY_AREAS.reduce((n, a) => n + a.manual.length, 0);
}
