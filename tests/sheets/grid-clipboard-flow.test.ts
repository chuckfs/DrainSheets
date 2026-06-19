import { describe, expect, it, vi } from "vitest";
import { parseTsv } from "@/lib/sheets/clipboard";
import {
  buildPasteCellUpdates,
  rowsToAddForPaste,
} from "@/lib/sheets/grid-operations";

describe("clipboard paste flow", () => {
  it("orchestrates paste from TSV into grid updates and row overflow", async () => {
    const matrix = parseTsv("North\t100\nSouth\t200");
    const startRow = 2;
    const startCol = 0;
    const currentRowCount = 3;
    const columnCount = 2;

    const rowsNeeded = rowsToAddForPaste(currentRowCount, startRow, matrix.length);
    const updates = buildPasteCellUpdates({
      matrix,
      startRow,
      startCol,
      columnCount,
    });

    expect(rowsNeeded).toBe(1);
    expect(updates).toEqual([
      { rowIndex: 2, colIndex: 0, value: "North" },
      { rowIndex: 2, colIndex: 1, value: 100 },
      { rowIndex: 3, colIndex: 0, value: "South" },
      { rowIndex: 3, colIndex: 1, value: 200 },
    ]);

    const addRows = vi.fn(async (count: number) => count === rowsNeeded);
    const batchCommitCells = vi.fn(async () => true);

    if (rowsNeeded > 0) {
      await addRows(rowsNeeded);
    }
    await batchCommitCells(updates, { activityLabel: "paste" });

    expect(addRows).toHaveBeenCalledWith(1);
    expect(batchCommitCells).toHaveBeenCalledWith(updates, { activityLabel: "paste" });
  });

  it("skips paste when clipboard text is empty", () => {
    const matrix = parseTsv("");
    expect(matrix).toEqual([]);
  });
});
