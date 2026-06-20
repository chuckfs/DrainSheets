"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { parseTsv, serializeRangeToTsv } from "@/lib/sheets/clipboard";
import { buildPasteCellUpdates, rowsToAddForPaste } from "@/lib/sheets/grid-operations";
import { isGridEditableTarget, resolveGridKeyboardShortcut } from "@/lib/sheets/grid-keyboard";
import type { SheetGridController } from "./use-sheet-grid";

export function useSheetClipboard(
  grid: SheetGridController,
  options?: {
    onAfterPaste?: () => void;
  },
) {
  const copySelection = useCallback(async () => {
    if (!grid.selectionRange || grid.readOnly) {
      return;
    }

    const { minRow, maxRow, minCol, maxCol } = grid.normalizedSelection;
    const tsv = serializeRangeToTsv(grid.getCellValue, minRow, maxRow, minCol, maxCol);

    try {
      await navigator.clipboard.writeText(tsv);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Unable to copy to clipboard");
    }
  }, [grid]);

  const cutSelection = useCallback(async () => {
    await copySelection();
    await grid.clearSelectionValues();
  }, [copySelection, grid]);

  const pasteFromClipboard = useCallback(async () => {
    if (grid.readOnly || !grid.selectedCell) {
      return;
    }

    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      toast.error("Unable to read clipboard");
      return;
    }

    const matrix = parseTsv(text);
    if (matrix.length === 0) {
      return;
    }

    const startRow = grid.selectedCell.rowIndex;
    const startCol = grid.selectedCell.colIndex;
    const rowsNeeded = rowsToAddForPaste(grid.totalRowCount, startRow, matrix.length);

    if (rowsNeeded > 0) {
      const added = await grid.addRows(rowsNeeded);
      if (!added) {
        toast.error("Could not create rows for paste");
        return;
      }
    }

    const updates = buildPasteCellUpdates({
      matrix,
      startRow,
      startCol,
      columnCount: grid.columns.length,
    });

    await grid.batchCommitCells(updates, { activityLabel: "paste" });
    options?.onAfterPaste?.();
    toast.success("Pasted from clipboard");
  }, [grid, options]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (grid.readOnly || isGridEditableTarget(event.target)) {
        return;
      }

      const shortcut = resolveGridKeyboardShortcut(event);
      if (!shortcut) {
        return;
      }

      if (shortcut === "copy") {
        event.preventDefault();
        void copySelection();
        return;
      }

      if (shortcut === "cut") {
        event.preventDefault();
        void cutSelection();
        return;
      }

      if (shortcut === "paste") {
        event.preventDefault();
        void pasteFromClipboard();
      }
    },
    [copySelection, cutSelection, grid.readOnly, pasteFromClipboard],
  );

  return {
    copySelection,
    cutSelection,
    pasteFromClipboard,
    handleKeyDown,
  };
}

export type SheetClipboardController = ReturnType<typeof useSheetClipboard>;
