"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getColumnDecimals } from "@/lib/sheets/column-config";
import type { SheetColumn } from "@/types/domain";
import type { SheetGridController } from "./use-sheet-grid";

export function SheetDecimalControls({
  grid,
  column,
}: {
  grid: SheetGridController;
  column: SheetColumn | null;
}) {
  if (!column || (column.type !== "number" && column.type !== "currency") || grid.readOnly) {
    return null;
  }

  const decimals = getColumnDecimals(column);

  return (
    <div className="flex items-center gap-0.5">
      <span className="text-xs text-muted-foreground">Decimals</span>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-7"
        aria-label="Decrease decimal places"
        disabled={decimals <= 0}
        onClick={() => void grid.updateColumnDecimals(column.id, decimals - 1)}
      >
        <MinusIcon className="size-3.5" />
      </Button>
      <span className="min-w-4 text-center text-xs tabular-nums">{decimals}</span>
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="size-7"
        aria-label="Increase decimal places"
        disabled={decimals >= 6}
        onClick={() => void grid.updateColumnDecimals(column.id, decimals + 1)}
      >
        <PlusIcon className="size-3.5" />
      </Button>
    </div>
  );
}
