import { describe, expect, it } from "vitest";
import {
  clamp,
  computeRowReorder,
  getRowPositionUpdates,
} from "@/lib/sheets/row-position";

describe("row position helpers", () => {
  it("clamps values to bounds", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-2, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it("moves a row down and reindexes positions", () => {
    const before = [
      { id: "a", position: 0 },
      { id: "b", position: 1 },
      { id: "c", position: 2 },
    ];

    const after = computeRowReorder(before, "a", 2);

    expect(after).toEqual([
      { id: "b", position: 0 },
      { id: "c", position: 1 },
      { id: "a", position: 2 },
    ]);
  });

  it("clamps target position to last index", () => {
    const before = [
      { id: "a", position: 0 },
      { id: "b", position: 1 },
    ];

    const after = computeRowReorder(before, "a", 99);

    expect(after).toEqual([
      { id: "b", position: 0 },
      { id: "a", position: 1 },
    ]);
  });

  it("throws when row id is missing", () => {
    expect(() =>
      computeRowReorder([{ id: "a", position: 0 }], "missing", 0),
    ).toThrow(/row not found/i);
  });

  it("returns only changed position updates", () => {
    const before = [
      { id: "a", position: 0 },
      { id: "b", position: 1 },
      { id: "c", position: 2 },
    ];
    const after = computeRowReorder(before, "a", 2);

    expect(getRowPositionUpdates(before, after)).toEqual([
      { id: "b", position: 0 },
      { id: "c", position: 1 },
      { id: "a", position: 2 },
    ]);
  });
});
