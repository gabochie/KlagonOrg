import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Worker ↔ client ↔ database contract. Money breaks silently when any side
 * drifts: a client posts to a route the Worker never registered, or the
 * Worker calls an RPC no migration created. These read the three sides as
 * text and assert the names line up — no secrets, no network, no DB.
 */

const root = path.resolve(__dirname, "..", "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

const worker = read("workers/moolre/worker.js");
const clients = [
  "src/lib/coursePayments.ts",
  "src/lib/sponsorPayments.ts",
  "src/lib/boostPayments.ts",
  "src/lib/payments.ts",
].map(read).join("\n");
const migDir = path.join(root, "supabase", "migrations");
const migrations = fs
  .readdirSync(migDir)
  .filter((f) => f.endsWith(".sql"))
  .map((f) => fs.readFileSync(path.join(migDir, f), "utf8"))
  .join("\n");

describe("worker route contract", () => {
  const routes = [
    "/api/courses/charge",
    "/api/courses/confirm",
    "/api/sponsors/charge",
    "/api/sponsors/confirm",
    "/api/boosts/charge",
    "/api/boosts/confirm",
    "/api/donations/charge",
    "/api/donations/confirm",
    "/api/payments/status",
  ];
  for (const route of routes) {
    it(`worker serves ${route} and some client calls it`, () => {
      expect(worker).toContain(`"${route}"`);
      expect(clients).toContain(route);
    });
  }

  it("registers no client-called route twice (first match wins in the worker)", () => {
    for (const route of ["/api/courses/charge", "/api/sponsors/charge", "/api/boosts/charge"]) {
      const occurrences = worker.split(`"${route}"`).length - 1;
      expect(occurrences).toBe(1);
    }
  });
});

describe("worker RPC contract", () => {
  // RPCs the worker calls over HTTP (sbRpc/sbRpcSigned). Anything here that
  // no migration creates means charging is broken end-to-end.
  const workerRpcs = [
    "create_course_order",
    "confirm_course_payment_by_ref",
    "get_course_sendable",
    "sponsor_quote",
    "confirm_sponsor_payment_by_ref",
    "get_sponsor_sendable",
    "boost_quote",
    "confirm_boost_payment_by_ref",
    "get_boost_sendable",
    "confirm_donation_by_ref",
    "get_donation_sendable",
  ];
  for (const fn of workerRpcs) {
    it(`worker-called ${fn}() exists in migrations`, () => {
      expect(worker).toContain(fn);
      expect(migrations).toMatch(new RegExp(`function\\s+public\\.${fn}\\s*\\(`, "i"));
    });
  }

  // SQL-level helpers other RPCs call internally (never over HTTP): they must
  // exist or the worker-called RPCs above fail at runtime.
  const internalHelpers = ["course_quote", "grant_course_access"];
  for (const fn of internalHelpers) {
    it(`internal helper ${fn}() exists in migrations`, () => {
      expect(migrations).toMatch(new RegExp(`function\\s+public\\.${fn}\\s*\\(`, "i"));
    });
  }
});
