"use client";

import { Loader2Icon } from "lucide-react";
import { getCellRenderer } from "@/components/sheets/cell-renderers/cell-renderer-factory";
import type { Json } from "@/types/database";
import type { SheetColumn } from "@/types/domain";
import { cn } from "@/lib/utils";
import type { CellCoord, SheetGridController } from "./use-sheet-grid";
import type { NavigateDirection } from "./cell-renderers/types";

type EditableCellProps = {
  grid: SheetGridController;
  rowIndex: number;
  colIndex: number;
  rowId: string;
  column: SheetColumn;
  value: Json | undefined;
};

export function EditableCell({
  grid,
  rowIndex,
  colIndex,
  rowId,
  column,
  value,
}: EditableCellProps) {
  const coord: CellCoord = { rowIndex, colIndex };
  const isSelected =
    grid.selectedCell?.rowIndex === rowIndex && grid.selectedCell?.colIndex === colIndex;
  const isEditing =
    grid.editingCell?.rowIndex === rowIndex && grid.editingCell?.colIndex === colIndex;
  const isSaving = grid.savingCell?.rowId === rowId && grid.savingCell?.columnKey === column.key;

  const Renderer = getCellRenderer(column.type);
  const mode = isEditing || column.type === "checkbox" ? "edit" : "display";

  function handleNavigate(direction: NavigateDirection) {
    grid.navigate(direction, coord);
  }

  function handleCommit(nextValue: Json | undefined) {
    void grid.commitCell(rowIndex, colIndex, nextValue);
  }

  function handleCancel() {
    grid.stopEditing();
  }

  function handleContainerKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isEditing) {
      return;
    }

    if (event.key === "Enter" || event.key === "F2") {
      event.preventDefault();
      grid.startEditing(coord);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      grid.navigate("up", coord);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      grid.navigate("down", coord);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      grid.navigate("left", coord);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      grid.navigate("right", coord);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      grid.navigate(event.shiftKey ? "prev" : "next", coord);
    }
  }

  return (
    <div
      role="gridcell"
      tabIndex={isSelected ? 0 : -1}
      data-row-index={rowIndex}
      data-col-index={colIndex}
      className={cn(
        "relative h-full min-h-7 outline-none",
        isSelected && "ring-2 ring-inset ring-primary/40",
        isSaving && "bg-muted/40",
      )}
      onMouseDown={() => grid.setSelectedCell(coord)}
      onClick={() => {
        grid.setSelectedCell(coord);
        if (column.type !== "checkbox") {
          grid.startEditing(coord);
        }
      }}
      onDoubleClick={() => grid.startEditing(coord)}
      onKeyDown={handleContainerKeyDown}
    >
      <Renderer
        column={column}
        value={value}
        mode={mode}
        isSaving={isSaving}
        autoFocus={isEditing}
        onCommit={handleCommit}
        onCancel={handleCancel}
        onNavigate={handleNavigate}
      />
      {isSaving && (
        <Loader2Icon className="pointer-events-none absolute top-1 right-1 size-3 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
