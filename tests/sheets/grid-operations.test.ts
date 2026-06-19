import { describe, expect, it } from "vitest";
import {
  applyLocalCellUpdates,
  buildClearSelectionUpdates,
  buildFillDownUpdates,
  buildPasteCellUpdates,
  cellValuesEqual,
  mergeBatchServerUpdates,
  rowsToAddForPaste,
} from "@/lib/sheets/grid-operations";

describe("grid paste operations", () => {
  it("builds paste updates from active cell downward and rightward", () => {
    const updates = buildPasteCellUpdates({
      matrix: [
        ["A", "B"],
        ["1", "2"],
      ],
      startRow: 1,
      startCol: 1,
      columnCount: 3,
    });

    expect(updates).toEqual([
      { rowIndex: 1, colIndex: 1, value: "A" },
      { rowIndex: 1, colIndex: 2, value: "B" },
      { rowIndex: 2, colIndex: 1, value: 1 },
      { rowIndex: 2, colIndex: 2, value: 2 },
    ]);
  });

  it("skips paste columns beyond sheet width", () => {
    const updates = buildPasteCellUpdates({
      matrix: [["A", "B", "C"]],
      startRow: 0,
      startCol: 1,
      columnCount: 2,
    });

    expect(updates).toEqual([{ rowIndex: 0, colIndex: 1, value: "A" }]);
  });

  it("computes additional rows needed for overflow paste", () => {
    expect(rowsToAddForPaste(5, 3, 2)).toBe(0);
    expect(rowsToAddForPaste(5, 4, 2)).toBe(1);
    expect(rowsToAddForPaste(10, 0, 12)).toBe(2);
  });
});

describe("grid fill-down operations", () => {
  it("copies top row values into remaining selected rows", () => {
    const values = [
      ["Top", 10, true],
      ["Old", 20, false],
      ["Older", 30, false],
    ];

    const updates = buildFillDownUpdates({
      range: {
        start: { rowIndex: 0, colIndex: 0 },
        end: { rowIndex: 2, colIndex: 2 },
      },
      getValue: (rowIndex, colIndex) => values[rowIndex]?.[colIndex],
    });

    expect(updates).toEqual([
      { rowIndex: 1, colIndex: 0, value: "Top" },
      { rowIndex: 2, colIndex: 0, value: "Top" },
      { rowIndex: 1, colIndex: 1, value: 10 },
      { rowIndex: 2, colIndex: 1, value: 10 },
      { rowIndex: 1, colIndex: 2, value: true },
      { rowIndex: 2, colIndex: 2, value: true },
    ]);
  });

  it("returns no updates for single-row selections", () => {
    const updates = buildFillDownUpdates({
      range: {
        start: { rowIndex: 0, colIndex: 0 },
        end: { rowIndex: 0, colIndex: 1 },
      },
      getValue: () => "value",
    });

    expect(updates).toEqual([]);
  });
});

describe("grid batch merge operations", () => {
  it("merges multiple cell updates for the same row", () => {
    const rows = [{ id: "row-1" }, { id: "row-2" }];
    const columns = [{ key: "company" }, { key: "status" }];

    const merged = mergeBatchServerUpdates(
      [
        { rowIndex: 0, colIndex: 0, value: "Acme" },
        { rowIndex: 0, colIndex: 1, value: "Active" },
        { rowIndex: 1, colIndex: 0, value: "Beta" },
      ],
      rows,
      columns,
    );

    expect(merged).toEqual([
      { rowId: "row-1", data: { company: "Acme", status: "Active" } },
      { rowId: "row-2", data: { company: "Beta" } },
    ]);
  });

  it("ignores temp rows and missing columns", () => {
    const merged = mergeBatchServerUpdates(
      [{ rowIndex: 0, colIndex: 0, value: "Skip" }],
      [{ id: "temp-123" }],
      [{ key: "company" }],
    );

    expect(merged).toEqual([]);
  });
});

describe("grid clear-selection operations", () => {
  it("builds null updates for every cell in a range", () => {
    const updates = buildClearSelectionUpdates({
      minRow: 1,
      maxRow: 2,
      minCol: 0,
      maxCol: 1,
    });

    expect(updates).toEqual([
      { rowIndex: 1, colIndex: 0, value: null },
      { rowIndex: 1, colIndex: 1, value: null },
      { rowIndex: 2, colIndex: 0, value: null },
      { rowIndex: 2, colIndex: 1, value: null },
    ]);
  });
});

describe("grid local update application", () => {
  it("applies batch updates to in-memory rows", () => {
    const rows = [
      { id: "row-1", data: { company: "Acme", status: "Open" } },
      { id: "row-2", data: { company: "Beta", status: "Closed" } },
    ];
    const columns = [{ key: "company" }, { key: "status" }];

    const next = applyLocalCellUpdates(
      rows,
      [
        { rowIndex: 0, colIndex: 0, value: "Acme Corp" },
        { rowIndex: 1, colIndex: 1, value: "Open" },
      ],
      columns,
      (row) => row.data as Record<string, unknown>,
    );

    expect(next[0]?.data).toEqual({ company: "Acme Corp", status: "Open" });
    expect(next[1]?.data).toEqual({ company: "Beta", status: "Open" });
  });
});

describe("grid value equality", () => {
  it("compares JSON values deeply", () => {
    expect(cellValuesEqual(10, 10)).toBe(true);
    expect(cellValuesEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(cellValuesEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(cellValuesEqual(null, undefined)).toBe(false);
  });
});
