"use client";

import { PlusIcon } from "lucide-react";
import { SmartsheetGridHead } from "@/components/data/smartsheet-grid";
import { Button } from "@/components/ui/button";
import { GridContextMenu } from "@/components/sheets/grid-context-menu";
import { ROW_NUMBER_WIDTH } from "@/lib/sheets/column-widths";
import type { SheetGridController } from "./use-sheet-grid";

export function RowNumberHeaderCell({ grid }: { grid: SheetGridController }) {
  if (grid.readOnly) {
    return (
      <span className="block w-full text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        #
      </span>
    );
  }

  return (
    <GridContextMenu
      items={[
        {
          id: "add-row",
          label: "Add row",
          onSelect: () => void grid.addRow(),
        },
      ]}
    >
      <div className="flex h-full w-full items-center justify-center">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">#</span>
      </div>
    </GridContextMenu>
  );
}

export function AddColumnHeadCell({ grid }: { grid: SheetGridController }) {
  if (grid.readOnly) {
    return null;
  }

  return (
    <SmartsheetGridHead
      className="px-1"
      style={{ width: 40, minWidth: 40, maxWidth: 40 }}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-7 text-muted-foreground hover:text-foreground"
        aria-label="Add column"
        onClick={() => void grid.addColumn("Column", "text")}
      >
        <PlusIcon className="size-4" />
      </Button>
    </SmartsheetGridHead>
  );
}

export function AddRowFooter({ grid, columnCount }: { grid: SheetGridController; columnCount: number }) {
  if (grid.readOnly) {
    return null;
  }

  return (
    <tr className="h-8 border-grid-line hover:bg-row-hover">
      <td
        className="sticky left-0 z-[5] border-r border-grid-line bg-background p-0 align-middle"
        style={{ width: ROW_NUMBER_WIDTH, minWidth: ROW_NUMBER_WIDTH }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-full min-h-8 rounded-none text-muted-foreground hover:text-foreground"
          aria-label="Add row"
          onClick={() => void grid.addRow()}
        >
          <PlusIcon className="size-4" />
        </Button>
      </td>
      <td colSpan={columnCount} className="border-r border-grid-line bg-background p-0" />
    </tr>
  );
}
