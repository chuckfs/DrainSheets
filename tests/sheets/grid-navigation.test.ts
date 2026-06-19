import { describe, expect, it } from "vitest";
import { computeNavigateCoord } from "@/lib/sheets/grid-navigation";

describe("grid keyboard navigation", () => {
  it.each([
    ["up", { rowIndex: 2, colIndex: 1 }, { rowIndex: 1, colIndex: 1 }],
    ["down", { rowIndex: 2, colIndex: 1 }, { rowIndex: 3, colIndex: 1 }],
    ["left", { rowIndex: 2, colIndex: 1 }, { rowIndex: 2, colIndex: 0 }],
    ["right", { rowIndex: 2, colIndex: 1 }, { rowIndex: 2, colIndex: 2 }],
  ] as const)("moves %s from center cell", (direction, from, expected) => {
    expect(
      computeNavigateCoord({
        direction,
        from,
        rowCount: 5,
        columnCount: 3,
      }),
    ).toEqual(expected);
  });

  it("wraps next across row boundary", () => {
    expect(
      computeNavigateCoord({
        direction: "next",
        from: { rowIndex: 1, colIndex: 2 },
        rowCount: 4,
        columnCount: 3,
      }),
    ).toEqual({ rowIndex: 2, colIndex: 0 });
  });

  it("wraps prev across row boundary", () => {
    expect(
      computeNavigateCoord({
        direction: "prev",
        from: { rowIndex: 1, colIndex: 0 },
        rowCount: 4,
        columnCount: 3,
      }),
    ).toEqual({ rowIndex: 0, colIndex: 2 });
  });

  it("clamps movement at sheet edges", () => {
    expect(
      computeNavigateCoord({
        direction: "up",
        from: { rowIndex: 0, colIndex: 1 },
        rowCount: 3,
        columnCount: 3,
      }),
    ).toEqual({ rowIndex: 0, colIndex: 1 });

    expect(
      computeNavigateCoord({
        direction: "right",
        from: { rowIndex: 1, colIndex: 2 },
        rowCount: 3,
        columnCount: 3,
      }),
    ).toEqual({ rowIndex: 1, colIndex: 2 });
  });
});
