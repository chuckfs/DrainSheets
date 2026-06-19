"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { parseClipboardValue, parseTsv, serializeRangeToTsv } from "@/lib/sheets/clipboard";
import type { Json } from "@/types/database";
import type { SheetGridController } from "./use-sheet-grid";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

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
    const requiredRows = startRow + matrix.length;

    if (requiredRows > grid.rows.length) {
      const added = await grid.addRows(requiredRows - grid.rows.length);
      if (!added) {
        toast.error("Could not create rows for paste");
        return;
      }
    }

    const updates: Array<{ rowIndex: number; colIndex: number; value: Json | undefined }> = [];

    for (let rowOffset = 0; rowOffset < matrix.length; rowOffset += 1) {
      const rowValues = matrix[rowOffset] ?? [];
      for (let colOffset = 0; colOffset < rowValues.length; colOffset += 1) {
        const rowIndex = startRow + rowOffset;
        const colIndex = startCol + colOffset;
        if (colIndex >= grid.columns.length) {
          continue;
        }

        updates.push({
          rowIndex,
          colIndex,
          value: parseClipboardValue(rowValues[colOffset] ?? ""),
        });
      }
    }

    await grid.batchCommitCells(updates, { activityLabel: "paste" });
    options?.onAfterPaste?.();
    toast.success("Pasted from clipboard");
  }, [grid, options]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (grid.readOnly || isEditableTarget(event.target)) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;
      if (!mod) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "c") {
        event.preventDefault();
        void copySelection();
        return;
      }

      if (key === "x") {
        event.preventDefault();
        void cutSelection();
        return;
      }

      if (key === "v") {
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
