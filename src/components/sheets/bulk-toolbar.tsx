"use client";

import { EraserIcon, Trash2Icon } from "lucide-react";
import { getSelectedRowIndexes, rangeSpansMultipleCells } from "@/lib/sheets/selection";
import { Button } from "@/components/ui/button";
import type { SheetGridController } from "./use-sheet-grid";

export function BulkToolbar({ grid }: { grid: SheetGridController }) {
  if (grid.readOnly) {
    return null;
  }

  const selectedRows = getSelectedRowIndexes(grid.selectionRange);
  const rowCount = selectedRows.length;
  const multiCell = rangeSpansMultipleCells(grid.selectionRange);

  if (rowCount <= 1 && !multiCell) {
    return null;
  }

  const cellCount = grid.selectionRange
    ? (() => {
        const { minRow, maxRow, minCol, maxCol } = grid.normalizedSelection;
        return (maxRow - minRow + 1) * (maxCol - minCol + 1);
      })()
    : 0;

  return (
    <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-1.5 text-xs">
      <span className="text-muted-foreground">
        {rowCount > 1
          ? `${rowCount} rows selected`
          : cellCount > 1
            ? `${cellCount} cells selected`
            : "1 cell selected"}
      </span>
      {rowCount > 1 && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => void grid.bulkDeleteRows()}
        >
          <Trash2Icon className="size-3.5" />
          Delete rows
        </Button>
      )}
      {(cellCount > 1 || rowCount > 1) && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={() => void grid.clearSelectionValues()}
        >
          <EraserIcon className="size-3.5" />
          Clear values
        </Button>
      )}
    </div>
  );
}
