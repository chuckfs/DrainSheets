"use client";

import { memo } from "react";
import { GripVerticalIcon, MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { getCellRenderer } from "@/components/sheets/cell-renderers/cell-renderer-factory";
import type { Json } from "@/types/database";
import type { SheetColumn } from "@/types/domain";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CellCoord, SheetGridController } from "./use-sheet-grid";
import type { NavigateDirection } from "./cell-renderers/types";

type EditableCellProps = {
  grid: SheetGridController;
  rowIndex: number;
  colIndex: number;
  rowId: string;
  column: SheetColumn;
  value: Json | undefined;
  isSelected: boolean;
  isActive: boolean;
  isEditing: boolean;
  isSaving: boolean;
};

function EditableCellComponent({
  grid,
  rowIndex,
  colIndex,
  rowId,
  column,
  value,
  isSelected,
  isActive,
  isEditing,
  isSaving,
}: EditableCellProps) {
  const coord: CellCoord = { rowIndex, colIndex };
  const Renderer = getCellRenderer(column.type);
  const mode = isEditing || column.type === "checkbox" ? "edit" : "display";

  function handleNavigate(direction: NavigateDirection) {
    grid.navigate(direction, coord);
  }

  function handleCommit(nextValue: Json | undefined) {
    if (grid.readOnly) {
      return;
    }

    void grid.commitCell(rowIndex, colIndex, nextValue);
  }

  function handleContainerKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (isEditing) {
      return;
    }

    const extend = event.shiftKey;

    if (event.key === "Enter" || event.key === "F2") {
      event.preventDefault();
      if (!grid.readOnly) {
        grid.startEditing(coord);
      }
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      grid.navigate("up", coord, extend);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      grid.navigate("down", coord, extend);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      grid.navigate("left", coord, extend);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      grid.navigate("right", coord, extend);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      grid.navigate(event.shiftKey ? "prev" : "next", coord, false);
    }
  }

  return (
    <div
      role="gridcell"
      tabIndex={isActive ? 0 : -1}
      data-row-index={rowIndex}
      data-col-index={colIndex}
      className={cn(
        "relative h-full min-h-7 px-2 py-1 outline-none",
        isSelected && "bg-primary/8",
        isActive && "ring-2 ring-inset ring-primary/50",
        isSaving && "bg-muted/40",
      )}
      onPointerDown={(event) => {
        if (event.button !== 0) {
          return;
        }
        grid.beginSelection(coord, event.shiftKey);
      }}
      onPointerEnter={() => grid.updateDragSelection(coord)}
      onClick={() => {
        if (grid.readOnly) {
          return;
        }

        if (column.type !== "checkbox" && column.type !== "contact") {
          grid.startEditing(coord);
        }
      }}
      onDoubleClick={() => {
        if (!grid.readOnly) {
          grid.startEditing(coord);
        }
      }}
      onKeyDown={handleContainerKeyDown}
    >
      <Renderer
        column={column}
        value={value}
        mode={mode}
        isSaving={isSaving}
        autoFocus={isEditing}
        onCommit={handleCommit}
        onCancel={() => grid.stopEditing()}
        onNavigate={handleNavigate}
      />
      {isSaving && (
        <span className="pointer-events-none absolute top-1 right-1 size-2 animate-pulse rounded-full bg-primary" />
      )}
    </div>
  );
}

export const EditableCell = memo(EditableCellComponent, (prev, next) => {
  return (
    prev.rowId === next.rowId &&
    prev.column.id === next.column.id &&
    prev.value === next.value &&
    prev.isSelected === next.isSelected &&
    prev.isActive === next.isActive &&
    prev.isEditing === next.isEditing &&
    prev.isSaving === next.isSaving &&
    prev.rowIndex === next.rowIndex &&
    prev.colIndex === next.colIndex
  );
});

export function RowNumberCell({
  grid,
  rowIndex,
  rowId,
  onOpenRow,
}: {
  grid: SheetGridController;
  rowIndex: number;
  rowId: string;
  onOpenRow?: (rowId: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const isRowSelected =
    grid.selectionRange &&
    rowIndex >= grid.normalizedSelection.minRow &&
    rowIndex <= grid.normalizedSelection.maxRow;

  const isReadOnly = grid.readOnly;

  return (
    <div
      className={cn(
        "flex h-full min-h-7 items-center justify-between gap-0.5 px-1 tabular-nums text-muted-foreground",
        isRowSelected && "bg-primary/8",
        dragOver && "bg-primary/15",
      )}
      draggable={!isReadOnly && !rowId.startsWith("temp-")}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", rowId);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        if (isReadOnly) {
          return;
        }

        event.preventDefault();
        setDragOver(false);
        const sourceId = event.dataTransfer.getData("text/plain");
        if (sourceId && sourceId !== rowId) {
          void grid.moveRowToIndex(sourceId, rowIndex);
        }
      }}
    >
      <GripVerticalIcon
        className={cn("size-3 shrink-0 opacity-40", !isReadOnly && "cursor-grab")}
        aria-hidden
      />
      <span
        className={cn("text-xs", onOpenRow && "cursor-pointer hover:text-foreground")}
        onDoubleClick={() => onOpenRow?.(rowId)}
      >
        {rowIndex + 1}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm" className="size-5" aria-label="Row actions">
              <MoreHorizontalIcon className="size-3" />
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-40">
          {onOpenRow && (
            <DropdownMenuItem onClick={() => onOpenRow(rowId)}>Open row</DropdownMenuItem>
          )}
          {!isReadOnly && (
            <>
              <DropdownMenuItem onClick={() => void grid.duplicateRowById(rowId)}>
                Duplicate row
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => void grid.deleteRowById(rowId)}
              >
                Delete row
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
