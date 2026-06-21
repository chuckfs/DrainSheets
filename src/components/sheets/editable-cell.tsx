"use client";

import { memo } from "react";
import { GripVerticalIcon, MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { getCellRenderer } from "@/components/sheets/cell-renderers/cell-renderer-factory";
import type { Json } from "@/types/database";
import type { SheetColumn } from "@/types/domain";
import { cn } from "@/lib/utils";
import { rangeSpansMultipleCells } from "@/lib/sheets/selection";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CellCoord, SheetGridController } from "./use-sheet-grid";
import type { NavigateDirection } from "./cell-renderers/types";
import { cellStyleClassName, cellStyleInline, type CellStyle } from "@/lib/sheets/cell-style";
import { DEFAULT_ROW_HEIGHT } from "@/lib/sheets/row-heights";
import { FillHandle } from "./fill-handle";
import { GridContextMenu } from "./grid-context-menu";
import { RowResizeHandle } from "./row-resize-handle";
import { useSheetClipboardActions } from "./sheet-clipboard-context";

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
  cellStyle: CellStyle;
};

function EditableCellComponent({
  grid,
  rowIndex,
  colIndex,
  column,
  value,
  isSelected,
  isActive,
  isEditing,
  isSaving,
  cellStyle,
}: EditableCellProps) {
  const clipboard = useSheetClipboardActions();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
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

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "a") {
      event.preventDefault();
      event.stopPropagation();
      window.getSelection()?.removeAllRanges();
      grid.selectAll();
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

  const showFillHandle =
    isActive &&
    !isEditing &&
    !grid.readOnly &&
    !rangeSpansMultipleCells(grid.selectionRange);

  return (
    <GridContextMenu
      items={[
        {
          id: "copy",
          label: "Copy",
          onSelect: () => void clipboard.copySelection(),
          disabled: !grid.selectionRange,
        },
        {
          id: "paste",
          label: "Paste",
          onSelect: () => void clipboard.pasteFromClipboard(),
          disabled: grid.readOnly || !grid.selectedCell,
        },
        {
          id: "insert-row-above",
          label: "Insert row above",
          onSelect: () => void grid.insertRowAt(rowIndex),
          disabled: grid.readOnly,
          separatorBefore: true,
        },
        {
          id: "insert-row-below",
          label: "Insert row below",
          onSelect: () => void grid.insertRowAt(rowIndex + 1),
          disabled: grid.readOnly,
        },
        {
          id: "clear",
          label: "Clear contents",
          onSelect: () => void grid.clearSelectionValues(),
          disabled: grid.readOnly || !grid.selectionRange,
          separatorBefore: true,
        },
        {
          id: "fill",
          label: "Fill down",
          onSelect: () => void grid.fillDown(),
          disabled: grid.readOnly || !grid.selectedCell,
        },
      ]}
    >
      <div
        role="gridcell"
        tabIndex={isActive ? 0 : -1}
        data-row-index={rowIndex}
        data-col-index={colIndex}
        className={cn(
          "relative h-full min-h-7 outline-none",
          isEditing ? "p-0" : "px-2 py-1",
          cellStyleClassName(cellStyle),
          isSelected && "bg-primary/8",
          isActive && "z-10 ring-2 ring-inset ring-primary",
          isSaving && "bg-muted/40",
        )}
        style={cellStyleInline(cellStyle, { isDark })}
        onPointerDown={(event) => {
          if (event.button !== 0) {
            return;
          }
          grid.beginSelection(coord, event.shiftKey, {
            clientX: event.clientX,
            clientY: event.clientY,
          });
        }}
        onPointerEnter={() => grid.updateDragSelection(coord)}
        onDoubleClick={(event) => {
          if (grid.readOnly || column.type === "checkbox") {
            return;
          }

          event.preventDefault();
          grid.startEditing(coord);
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
        {showFillHandle ? <FillHandle grid={grid} coord={coord} /> : null}
      </div>
    </GridContextMenu>
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
    prev.colIndex === next.colIndex &&
    JSON.stringify(prev.cellStyle) === JSON.stringify(next.cellStyle)
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
  const rowHeight = grid.getRowHeight(rowIndex);
  const hasCustomHeight = rowHeight !== DEFAULT_ROW_HEIGHT;

  return (
    <GridContextMenu
      items={[
        ...(onOpenRow
          ? [{ id: "open", label: "Open row", onSelect: () => onOpenRow(rowId) }]
          : []),
        {
          id: "insert-above",
          label: "Insert row above",
          onSelect: () => void grid.insertRowAt(rowIndex),
          disabled: isReadOnly,
          separatorBefore: Boolean(onOpenRow),
        },
        {
          id: "insert-below",
          label: "Insert row below",
          onSelect: () => void grid.insertRowAt(rowIndex + 1),
          disabled: isReadOnly,
        },
        {
          id: "duplicate",
          label: "Duplicate row",
          onSelect: () => void grid.duplicateRowById(rowId),
          disabled: isReadOnly,
          separatorBefore: true,
        },
        {
          id: "hide",
          label: "Hide row",
          onSelect: () => void grid.hideRowById(rowId),
          disabled: isReadOnly,
        },
        {
          id: "reset-height",
          label: "Reset row height",
          onSelect: () => void grid.resetRowHeight(rowId),
          disabled: isReadOnly || !hasCustomHeight,
        },
        {
          id: "unhide-all",
          label: "Unhide all rows",
          onSelect: () => void grid.unhideAllRows(),
          disabled: isReadOnly,
        },
        {
          id: "delete",
          label: "Delete row",
          onSelect: () => void grid.deleteRowById(rowId),
          disabled: isReadOnly,
          destructive: true,
          separatorBefore: true,
        },
      ]}
    >
      <div
        className={cn(
          "group/row-number relative flex h-full min-h-7 items-center justify-between gap-0.5 px-1 tabular-nums text-muted-foreground",
          isRowSelected && "bg-primary/8",
          dragOver && "bg-primary/15",
        )}
        style={{ height: rowHeight }}
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
      {!isReadOnly && !rowId.startsWith("temp-") ? (
        <RowResizeHandle
          onResize={(deltaY) => grid.resizeRowHeight(rowId, deltaY)}
          onResizeEnd={() => {
            void grid.persistRowHeight(rowId, grid.getRowHeight(rowIndex));
          }}
        />
      ) : null}
      </div>
    </GridContextMenu>
  );
}
