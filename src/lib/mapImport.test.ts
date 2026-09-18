import { describe, it, expect } from "vitest";
import {
  mapEntityType,
  parseOsmCsv,
  validateOsmBatch,
  validateOsmRow,
  type RawOsmRow,
} from "./mapImport";

function row(overrides: Partial<RawOsmRow> = {}): RawOsmRow {
  return {
    company: "3Dees Event Centre",
    record_type: "SERVICES",
    osm_tag: "events_venue",
    phone: "",
    website: "",
    email: "",
    street: "",
    housenumber: "",
    osm_id: "way788490441",
    lat: "5.6272785",
    lon: "-0.0235932",
    ...overrides,
  };
}

describe("osm staging import kernel", () => {
  it("maps record types to entities", () => {
    expect(mapEntityType("RELIGION", "place_of_worship")).toBe("faith");
    expect(mapEntityType("EDUCATION-SCHOOL", "school")).toBe("school");
    expect(mapEntityType("PHARMACY", "pharmacy")).toBe("health");
    expect(mapEntityType("GOV-INSTITUTION", "police")).toBe("governance");
    expect(mapEntityType("RETAIL-SUPERMARKET", "supermarket")).toBe("business");
    expect(mapEntityType("???", "???")).toBe("community");
  });

  it("passes a clean row with osm entity id", () => {
    const v = validateOsmRow(row(), 2);
    expect(v.importable).toBe(true);
    expect(v.point?.entity_id).toBe("osm:way788490441");
    expect(v.point?.dedupeKey).toBe("osm:way788490441");
  });

  it("quarantines missing names, ids, coords, and out-of-box points", () => {
    expect(validateOsmRow(row({ company: "" }), 2).reasons).toContain("no-name");
    expect(validateOsmRow(row({ osm_id: "" }), 2).reasons).toContain("no-osm-id");
    expect(validateOsmRow(row({ lat: "", lon: "" }), 2).reasons).toContain("no-coords");
    expect(validateOsmRow(row({ lat: "6.5", lon: "-1.0" }), 2).reasons).toContain("outside-tema-west");
  });

  it("dedupes repeat osm ids inside one file", () => {
    const vs = validateOsmBatch([row(), row(), row({ osm_id: "way1" })]);
    expect(vs.filter((v) => v.importable)).toHaveLength(2);
    expect(vs[1].reasons).toContain("duplicate-in-file");
  });

  it("parses the staging header shape", () => {
    const csv = "company,record_type,osm_tag,phone,website,email,street,housenumber,osm_id,lat,lon\n" +
      'St Mary,RELIGION,place_of_worship,0244000000,,,Main St,,node1,5.63,-0.04\n';
    const rows = parseOsmCsv(csv);
    expect(rows).toHaveLength(1);
    const v = validateOsmRow(rows[0], 2);
    expect(v.importable).toBe(true);
    expect(v.point?.entity_type).toBe("faith");
    expect(v.point?.description).toContain("Main St");
  });
});
