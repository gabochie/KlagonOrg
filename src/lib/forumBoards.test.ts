import { describe, it, expect } from "vitest";
import { FORUM_BOARDS, forumBoardById } from "./forumBoards";

describe("forumBoards", () => {
  it("has unique ids in a stable order", () => {
    const ids = FORUM_BOARDS.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(FORUM_BOARDS[0].id).toBe("general");
  });

  it("resolves boards by id and misses unknown ids", () => {
    expect(forumBoardById("general")?.name).toBe("General Talk");
    expect(forumBoardById("nope")).toBeUndefined();
  });

  it("every board has a name, description and icon", () => {
    for (const b of FORUM_BOARDS) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.description?.length).toBeGreaterThan(0);
      expect(b.icon).toBeTruthy();
    }
  });
});