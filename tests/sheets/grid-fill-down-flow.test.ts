import { describe, expect, it, vi } from "vitest";
import { resolveGridKeyboardShortcut } from "@/lib/sheets/grid-keyboard";
import { buildFillDownUpdates } from "@/lib/sheets/grid-operations";

describe("fill-down interactive flow", () => {
  it("maps Cmd+D to fill-down and builds batch updates", async () => {
    const shortcut = resolveGridKeyboardShortcut({
      key: "d",
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
    });

    expect(shortcut).toBe("fill_down");

    const grid = [
      ["Active", true],
      ["Old", false],
      ["Older", false],
    ];

    const updates = buildFillDownUpdates({
      range: {
        start: { rowIndex: 0, colIndex: 0 },
        end: { rowIndex: 2, colIndex: 1 },
      },
      getValue: (rowIndex, colIndex) => grid[rowIndex]?.[colIndex],
    });

    const batchCommitCells = vi.fn(async () => true);
    await batchCommitCells(updates, { activityLabel: "fill_down", recordHistory: false });

    expect(batchCommitCells).toHaveBeenCalledWith(updates, {
      activityLabel: "fill_down",
      recordHistory: false,
    });
    expect(updates).toHaveLength(4);
  });
});
