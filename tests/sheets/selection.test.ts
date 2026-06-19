import { describe, expect, it } from "vitest";
import {
  getSelectedRowIndexes,
  isCellInRange,
  isSameCell,
  normalizeRange,
  rangeSpansMultipleCells,
  rangeSpansMultipleRows,
} from "@/lib/sheets/selection";

describe("sheet selection helpers", () => {
  it("normalizes inverted ranges", () => {
    expect(
      normalizeRange({
        start: { rowIndex: 3, colIndex: 2 },
        end: { rowIndex: 1, colIndex: 0 },
      }),
    ).toEqual({
      minRow: 1,
      maxRow: 3,
      minCol: 0,
      maxCol: 2,
    });
  });

  it("detects cells inside a range", () => {
    const range = {
      start: { rowIndex: 1, colIndex: 1 },
      end: { rowIndex: 2, colIndex: 2 },
    };

    expect(isCellInRange(1, 1, range)).toBe(true);
    expect(isCellInRange(0, 1, range)).toBe(false);
    expect(isCellInRange(2, 2, range)).toBe(true);
  });

  it("compares cell coordinates", () => {
    expect(isSameCell({ rowIndex: 1, colIndex: 2 }, { rowIndex: 1, colIndex: 2 })).toBe(true);
    expect(isSameCell({ rowIndex: 1, colIndex: 2 }, { rowIndex: 2, colIndex: 2 })).toBe(false);
  });

  it("collects selected row indexes", () => {
    expect(
      getSelectedRowIndexes({
        start: { rowIndex: 2, colIndex: 0 },
        end: { rowIndex: 4, colIndex: 1 },
      }),
    ).toEqual([2, 3, 4]);
  });

  it("detects multi-row and multi-cell ranges", () => {
    const singleCell = {
      start: { rowIndex: 0, colIndex: 0 },
      end: { rowIndex: 0, colIndex: 0 },
    };
    const multiRow = {
      start: { rowIndex: 0, colIndex: 0 },
      end: { rowIndex: 2, colIndex: 0 },
    };
    const multiCol = {
      start: { rowIndex: 0, colIndex: 0 },
      end: { rowIndex: 0, colIndex: 2 },
    };

    expect(rangeSpansMultipleRows(singleCell)).toBe(false);
    expect(rangeSpansMultipleRows(multiRow)).toBe(true);
    expect(rangeSpansMultipleCells(singleCell)).toBe(false);
    expect(rangeSpansMultipleCells(multiCol)).toBe(true);
  });
});
