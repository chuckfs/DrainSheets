import { describe, expect, it } from "vitest";
import { buildFillFromCellUpdates } from "@/lib/sheets/grid-operations";
import { buildBatchCellHistoryEntry } from "@/lib/sheets/grid-history";

describe("buildFillFromCellUpdates", () => {
  it("copies a source cell value through targetEndRow", () => {
    const grid = [["A"], ["B"], ["C"], ["D"]];

    const updates = buildFillFromCellUpdates({
      sourceRow: 0,
      sourceCol: 0,
      targetEndRow: 3,
      getValue: (rowIndex, colIndex) => grid[rowIndex]?.[colIndex],
    });

    expect(updates).toEqual([
      { rowIndex: 1, colIndex: 0, value: "A" },
      { rowIndex: 2, colIndex: 0, value: "A" },
      { rowIndex: 3, colIndex: 0, value: "A" },
    ]);
  });

  it("returns no updates when targetEndRow equals sourceRow", () => {
    const updates = buildFillFromCellUpdates({
      sourceRow: 2,
      sourceCol: 0,
      targetEndRow: 2,
      getValue: () => "x",
    });

    expect(updates).toEqual([]);
  });
});

describe("buildBatchCellHistoryEntry", () => {
  it("builds a batch undo entry for multi-cell updates", () => {
    const rows = [{ id: "row-1" }, { id: "row-2" }];
    const columns = [{ key: "name" }];

    const entry = buildBatchCellHistoryEntry(
      [
        { rowIndex: 0, colIndex: 0, value: "A" },
        { rowIndex: 1, colIndex: 0, value: "A" },
      ],
      rows,
      columns,
      (rowIndex) => (rowIndex === 0 ? "Seed" : "Old"),
    );

    expect(entry?.type).toBe("batch_cell");
    expect(entry?.cells).toHaveLength(2);
    expect(entry?.cells[0]?.before).toBe("Seed");
    expect(entry?.cells[1]?.before).toBe("Old");
  });
});
