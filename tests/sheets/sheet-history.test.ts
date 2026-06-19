import { describe, expect, it } from "vitest";
import {
  MAX_SHEET_HISTORY,
  resolveHistoryCellValue,
  SheetHistoryStack,
  type CellHistoryEntry,
} from "@/lib/sheets/sheet-history-stack";

describe("sheet history stack", () => {
  it("pushes undo entries and clears redo on new edits", () => {
    const stack = new SheetHistoryStack();

    stack.push({ type: "cell", rowId: "r1", columnKey: "company", before: "A", after: "B" });
    stack.push({ type: "cell", rowId: "r1", columnKey: "company", before: "B", after: "C" });

    expect(stack.canUndo).toBe(true);
    expect(stack.undoCount).toBe(2);

    const undone = stack.popUndo();
    expect(undone?.type).toBe("cell");
    expect(stack.canRedo).toBe(true);

    stack.push({ type: "cell", rowId: "r2", columnKey: "status", before: null, after: "Active" });
    expect(stack.canRedo).toBe(false);
    expect(stack.redoCount).toBe(0);
  });

  it("redoes the last undone entry", () => {
    const stack = new SheetHistoryStack();
    stack.push({ type: "cell", rowId: "r1", columnKey: "company", before: "A", after: "B" });

    const entry = stack.popUndo();
    const redone = stack.popRedo();

    expect(redone).toEqual(entry);
    expect(stack.canUndo).toBe(true);
    expect(stack.canRedo).toBe(false);
  });

  it("caps history depth at 50 entries", () => {
    const stack = new SheetHistoryStack();

    for (let index = 0; index < MAX_SHEET_HISTORY + 5; index += 1) {
      stack.push({
        type: "cell",
        rowId: `row-${index}`,
        columnKey: "company",
        before: index,
        after: index + 1,
      });
    }

    expect(stack.undoCount).toBe(MAX_SHEET_HISTORY);

    const first = stack.popUndo();
    expect(first?.rowId).toBe("row-54");
  });

  it("resolves cell values for undo and redo", () => {
    const entry: CellHistoryEntry = {
      type: "cell",
      rowId: "row-1",
      columnKey: "amount",
      before: 10,
      after: 25,
    };

    expect(resolveHistoryCellValue(entry, "undo")).toBe(10);
    expect(resolveHistoryCellValue(entry, "redo")).toBe(25);
  });
});
