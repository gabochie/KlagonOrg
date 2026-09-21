import { describe, it, expect } from "vitest";
import { rowsToChecked } from "./qaSignoffs";
import { checkId } from "./quality";

describe("qaSignoffs", () => {
  it("maps remote rows to checked ids", () => {
    expect(
      rowsToChecked([
        { area_id: "auth-roles", check_index: 0, checked: true },
        { area_id: "auth-roles", check_index: 1, checked: false },
      ])
    ).toEqual({ [checkId("auth-roles", 0)]: true });
  });

  it("drops malformed rows", () => {
    expect(rowsToChecked([])).toEqual({});
    expect(rowsToChecked([{ area_id: "", check_index: 0, checked: true }])).toEqual({
      [checkId("", 0)]: true,
    });
  });
});
