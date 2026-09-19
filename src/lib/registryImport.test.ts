import { describe, it, expect } from "vitest";
import {
  slugifyCompany,
  validateRegistryRow,
  validateRegistryBatch,
  parseRegistryCsv,
  type RawRegistryRow,
} from "./registryImport";

function row(overrides: Partial<RawRegistryRow> = {}): RawRegistryRow {
  return {
    id: "KGB0001",
    company: "Agenda Concrete (GHANA) Limited",
    firm_name: "",
    title: "Premix concrete supplier",
    contact_name: "",
    phone: "+233 24 111 4727",
    email: "",
    website: "",
    region: "Greater Accra",
    district: "Tema West",
    location: "Community 18 Junction, Klagon, Tema",
    verified_status: "PENDING",
    consent_status: "B2B_PUBLISHED",
    opt_out_date: "",
    record_type: "CONSTRUCTION-READYMIX",
    notes: "",
    ...overrides,
  };
}

describe("registry import kernel", () => {
  it("builds deterministic slugs and mapped entries", () => {
    expect(slugifyCompany("APOG Klagon", "KGB0002")).toBe("apog-klagon-kgb0002");
    const v = validateRegistryRow(row(), 2);
    expect(v.importable).toBe(true);
    expect(v.entry?.slug).toBe("agenda-concrete-ghana-limited-kgb0001");
    expect(v.entry?.categories).toEqual(["Construction Readymix"]);
    expect(v.entry?.location.area).toBe("Klagon");
    expect(v.entry?.contact.phone).toBe("+233 24 111 4727");
  });

  it("quarantines missing identity, consent, opt-outs, and phoneless rows", () => {
    expect(validateRegistryRow(row({ company: "", firm_name: "" }), 2).reasons).toContain("no-company");
    expect(validateRegistryRow(row({ id: "" }), 2).reasons).toContain("no-id");
    expect(validateRegistryRow(row({ consent_status: "NONE" }), 2).reasons[0]).toMatch(/bad-consent/);
    expect(validateRegistryRow(row({ opt_out_date: "2026-01-01" }), 2).reasons).toContain("opted-out");
    expect(validateRegistryRow(row({ phone: "" }), 2).reasons).toContain("no-phone");
  });

  it("dedupes repeat slugs inside one file", () => {
    const vs = validateRegistryBatch([row(), row()]);
    expect(vs[0].importable).toBe(true);
    expect(vs[1].reasons).toContain("duplicate-in-file");
  });

  it("falls back to firm_name and non-Klagon areas", () => {
    const v = validateRegistryRow(
      row({ company: "", firm_name: "Solo Ventures", location: "Sakumono", district: "" }),
      2
    );
    expect(v.importable).toBe(true);
    expect(v.entry?.name).toBe("Solo Ventures");
    expect(v.entry?.location.area).toBe("Tema West");
  });
});
