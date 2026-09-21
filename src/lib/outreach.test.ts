import { describe, it, expect } from "vitest";
import {
  normalizePhone,
  detectArea,
  gateRecord,
  gateClaimRecord,
  gateBatch,
  dedupeByPhone,
  buildDailyQueue,
  pickTemplate,
  pickClaimTemplate,
  buildWaLink,
  buildAutoBatch,
  parseSenderLog,
  isStopReply,
  parseShopCsv,
  type RawShopRecord,
} from "./outreach";

function shop(overrides: Partial<RawShopRecord> = {}): RawShopRecord {
  return {
    id: "KGB0001",
    company: "Test Shop",
    contact_name: "Ama",
    phone: "+233 24 123 4567",
    location: "Klagon, Tema",
    district: "Tema West",
    region: "Greater Accra",
    verified_status: "VERIFIED",
    consent_status: "B2B_PUBLISHED",
    opt_out_date: "",
    record_type: "RETAIL",
    ...overrides,
  };
}

describe("outreach kernel", () => {
  it("normalizes Ghana numbers to wa.me digits", () => {
    expect(normalizePhone("+233 24 123 4567")).toBe("233241234567");
    expect(normalizePhone("0241234567")).toBe("233241234567");
    expect(normalizePhone("241234567")).toBe("233241234567");
    expect(normalizePhone("+44 7700 900123")).toBe("447700900123");
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("123")).toBeNull();
  });

  it("detects Klagon vs standard area", () => {
    expect(detectArea({ location: "Klagon", district: "", region: "" })).toBe("klagon");
    expect(detectArea({ location: "Sakumono", district: "Tema West", region: "" })).toBe("standard");
  });

  it("gates a clean verified record as sendable", () => {
    const v = gateRecord(shop(), new Set());
    expect(v.sendable).toBe(true);
    expect(v.waPhone).toBe("233241234567");
    expect(v.area).toBe("klagon");
  });

  it("quarantines pending, phoneless, bad-consent, opted-out, stopped", () => {
    expect(gateRecord(shop({ verified_status: "PENDING" }), new Set()).sendable).toBe(false);
    expect(gateRecord(shop({ phone: "" }), new Set()).reasons).toContain("no-phone");
    expect(gateRecord(shop({ consent_status: "NONE" }), new Set()).reasons[0]).toMatch(/bad-consent/);
    expect(gateRecord(shop({ opt_out_date: "2026-09-01" }), new Set()).reasons).toContain("opted-out");
    expect(gateRecord(shop(), new Set(["233241234567"])).reasons).toContain("stopped");
  });

  it("dedupes shared numbers deterministically (first id wins, send once)", () => {
    const a = gateRecord(shop({ id: "KGB0183", phone: "+233 24 000 5487" }), new Set());
    const b = gateRecord(shop({ id: "KGB0185", phone: "0240005487" }), new Set());
    const c = gateRecord(shop({ id: "KGB0009", phone: "+233 24 999 0001" }), new Set());
    const { unique, duplicates } = dedupeByPhone([b, a, c]);
    expect(unique.map((v) => v.record.id).sort()).toEqual(["KGB0009", "KGB0183"]);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].keptId).toBe("KGB0183");
    expect(duplicates[0].dropped.record.id).toBe("KGB0185");
  });

  it("splits fairly across staff with a daily cap and rotation", () => {
    const sendable = Array.from({ length: 10 }, (_, i) =>
      gateRecord(shop({ id: `KGB${String(i).padStart(4, "0")}` }), new Set())
    );
    const q = buildDailyQueue(sendable, { perDay: 6, staffCount: 3, dayIndex: 0 });
    expect(q.map((s) => s.records.length)).toEqual([2, 2, 2]);
    const q2 = buildDailyQueue(sendable, { perDay: 6, staffCount: 3, dayIndex: 1 });
    expect(q2[0].records[0].record.id).not.toBe(q[0].records[0].record.id);
  });

  it("gates claim-drive rows without requiring VERIFIED", () => {
    const pending = shop({ verified_status: "PENDING" });
    const v = gateClaimRecord(pending, new Set());
    expect(v.sendable).toBe(true);
    expect(v.waPhone).toBe("233241234567");
    expect(gateClaimRecord(shop({ phone: "" }), new Set()).reasons).toContain("no-phone");
    expect(gateClaimRecord(shop({ consent_status: "NONE" }), new Set()).reasons[0]).toMatch(/bad-consent/);
    expect(gateClaimRecord(shop({ company: "  " }), new Set()).reasons).toContain("no-company");
    expect(gateClaimRecord(shop({ opt_out_date: "2026-09-01" }), new Set()).reasons).toContain("opted-out");
  });

  it("personalizes the claim template with the shop name and opt-out", () => {
    expect(pickClaimTemplate("klagon", "APOG Klagon")).toContain("APOG Klagon");
    expect(pickClaimTemplate("klagon", "APOG Klagon")).toContain("founding rate");
    expect(pickClaimTemplate("standard", "Foo")).toContain("STOP");
  });

  it("picks Klagon discount vs standard templates with opt-out", () => {
    expect(pickTemplate("klagon", "both")).toContain("GH₵150");
    expect(pickTemplate("standard", "both")).toContain("GH₵250");
    expect(pickTemplate("klagon", "health")).toContain("STOP");
  });

  it("builds encoded wa.me links", () => {
    expect(buildWaLink("233241234567", "Hello shop")).toBe("https://wa.me/233241234567?text=Hello%20shop");
  });

  it("detects STOP replies", () => {
    expect(isStopReply("STOP")).toBe(true);
    expect(isStopReply("please opt-out me")).toBe(true);
    expect(isStopReply("Yes, HEALTH please")).toBe(false);
  });

  it("parses quoted CSVs with commas inside fields", () => {
    const csv = `id,company,phone,location,verified_status,consent_status,opt_out_date\nKGB1,"Agenda Concrete (GHANA), Limited",+233241234567,"Community 18, Klagon",VERIFIED,B2B_PUBLISHED,`;
    const rows = parseShopCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].company).toBe("Agenda Concrete (GHANA), Limited");
    expect(rows[0].location).toBe("Community 18, Klagon");
  });

  it("exports only sendable verdicts as an auto-batch", () => {
    const verdicts = gateBatch(
      [shop({ id: "KGB0001" }), shop({ id: "KGB0002", verified_status: "PENDING" })],
      new Set()
    );
    const batch = buildAutoBatch(verdicts, (v) => pickTemplate(v.area, "both"), "both");
    expect(batch.version).toBe(1);
    expect(batch.template).toBe("both");
    expect(batch.items).toHaveLength(1);
    expect(batch.items[0]).toMatchObject({ id: "KGB0001", waPhone: "233241234567" });
    expect(batch.items[0].text).toContain("STOP");
  });

  it("parses sender logs and drops malformed entries", () => {
    const entries = parseSenderLog({
      items: [
        { id: "KGB0001", status: "sent", at: "2026-09-21T10:00:00Z" },
        { id: "KGB0002", status: "failed", at: "" },
        { id: "", status: "sent", at: "" },
        { id: "KGB0003", status: "bogus", at: "" },
        "not-an-object",
      ],
    });
    expect(entries).toHaveLength(2);
    expect(entries[0]).toEqual({ id: "KGB0001", status: "sent", at: "2026-09-21T10:00:00Z" });
    expect(parseSenderLog(null)).toEqual([]);
    expect(parseSenderLog({})).toEqual([]);
  });
});
