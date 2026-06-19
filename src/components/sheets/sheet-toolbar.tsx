"use client";

import { useState } from "react";
import { ColumnsIcon, PlusIcon, RowsIcon } from "lucide-react";
import type { Sheet } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { SheetHeader } from "@/components/layout/sheet-header";
import { AddColumnDialog } from "./add-column-dialog";
import type { SheetGridController } from "./use-sheet-grid";

export function SheetToolbar({
  sheet,
  grid,
}: {
  sheet: Sheet;
  grid: SheetGridController;
}) {
  const [addColumnOpen, setAddColumnOpen] = useState(false);

  return (
    <>
      <SheetHeader
        eyebrow="Sheet"
        title={sheet.name}
        subtitle={sheet.description ?? undefined}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <RowsIcon className="size-3" />
              {grid.rows.length} {grid.rows.length === 1 ? "row" : "rows"}
            </span>
            <span className="inline-flex items-center gap-1">
              <ColumnsIcon className="size-3" />
              {grid.columns.length} {grid.columns.length === 1 ? "column" : "columns"}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              disabled={grid.isAddingRow}
              onClick={() => void grid.addRow()}
            >
              <PlusIcon className="size-3.5" />
              Add row
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              onClick={() => setAddColumnOpen(true)}
            >
              <ColumnsIcon className="size-3.5" />
              Add column
            </Button>
          </div>
        }
      />

      <AddColumnDialog
        open={addColumnOpen}
        onOpenChange={setAddColumnOpen}
        onAdd={grid.addColumn}
      />
    </>
  );
}
