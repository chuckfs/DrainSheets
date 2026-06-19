"use client";

import { memo, useEffect, useRef } from "react";
import type { Json } from "@/types/database";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";
import {
  SmartsheetGridPinCell,
  SmartsheetGridPinHead,
} from "@/components/data/grid-pinned-columns";
import { ROW_NUMBER_WIDTH } from "@/lib/sheets/column-widths";
import type { ColumnLayout } from "@/lib/sheets/column-widths";
import type { Row } from "@/types/domain";
import { cn } from "@/lib/utils";
import { ColumnHeader } from "@/components/sheets/column-header";
import { EditableCell, RowNumberCell } from "@/components/sheets/editable-cell";
import type { SheetGridController } from "./use-sheet-grid";

export function SheetGrid({ grid }: { grid: SheetGridController }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { columnLayout, rows, selectedCell } = grid;

  useEffect(() => {
    if (!selectedCell || !gridRef.current) {
      return;
    }

    const selector = `[data-row-index="${selectedCell.rowIndex}"][data-col-index="${selectedCell.colIndex}"]`;
    const element = gridRef.current.querySelector<HTMLElement>(selector);
    element?.focus();
  }, [selectedCell]);

  if (columnLayout.length === 0) {
    return (
      <SmartsheetGridEmpty message="This sheet has no columns yet. Use Add column to create one." />
    );
  }

  return (
    <div ref={gridRef} role="grid" aria-rowcount={rows.length} aria-colcount={columnLayout.length}>
      <SmartsheetGrid>
        <SmartsheetGridHeader>
          <SmartsheetGridRow>
            <SmartsheetGridPinHead
              pinLeft={0}
              className="w-12 text-center"
              style={{ width: ROW_NUMBER_WIDTH, minWidth: ROW_NUMBER_WIDTH }}
            >
              #
            </SmartsheetGridPinHead>
            {columnLayout.map((layout, columnIndex) => (
              <ColumnHeadCell
                key={layout.id}
                layout={layout}
                columnIndex={columnIndex}
                columnCount={columnLayout.length}
                grid={grid}
              />
            ))}
          </SmartsheetGridRow>
        </SmartsheetGridHeader>
        <SmartsheetGridBody>
          {rows.length === 0 ? (
            <SmartsheetGridRow>
              <SmartsheetGridCell
                colSpan={columnLayout.length + 1}
                className="py-8 text-center text-muted-foreground"
              >
                No rows yet. Use Add row to create one.
              </SmartsheetGridCell>
            </SmartsheetGridRow>
          ) : (
            rows.map((row, rowIndex) => (
              <SheetGridRowMemo
                key={row.id}
                row={row}
                rowIndex={rowIndex}
                columnLayout={columnLayout}
                grid={grid}
              />
            ))
          )}
        </SmartsheetGridBody>
      </SmartsheetGrid>
    </div>
  );
}

function ColumnHeadCell({
  layout,
  columnIndex,
  columnCount,
  grid,
}: {
  layout: ColumnLayout;
  columnIndex: number;
  columnCount: number;
  grid: SheetGridController;
}) {
  const style = {
    width: layout.widthPx,
    minWidth: layout.widthPx,
    maxWidth: layout.widthPx,
  };

  if (layout.is_pinned && layout.pinLeft !== undefined) {
    return (
      <SmartsheetGridPinHead pinLeft={layout.pinLeft} style={style}>
        <ColumnHeader
          column={layout}
          layout={layout}
          columnIndex={columnIndex}
          columnCount={columnCount}
          grid={grid}
        />
      </SmartsheetGridPinHead>
    );
  }

  return (
    <SmartsheetGridHead style={style}>
      <ColumnHeader
        column={layout}
        layout={layout}
        columnIndex={columnIndex}
        columnCount={columnCount}
        grid={grid}
      />
    </SmartsheetGridHead>
  );
}

type SheetGridRowProps = {
  row: Row;
  rowIndex: number;
  columnLayout: ColumnLayout[];
  grid: SheetGridController;
};

function SheetGridRowComponent({ row, rowIndex, columnLayout, grid }: SheetGridRowProps) {
  const rowData =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, Json | undefined>)
      : {};

  return (
    <SmartsheetGridRow>
      <SmartsheetGridPinCell
        pinLeft={0}
        className="p-0"
        style={{ width: ROW_NUMBER_WIDTH, minWidth: ROW_NUMBER_WIDTH }}
      >
        <RowNumberCell grid={grid} rowIndex={rowIndex} rowId={row.id} />
      </SmartsheetGridPinCell>
      {columnLayout.map((layout, colIndex) => {
        const value = rowData[layout.key];
        const isSelected = grid.isCellSelected(rowIndex, colIndex);
        const isActive = grid.isCellActive(rowIndex, colIndex);
        const isEditing =
          grid.editingCell?.rowIndex === rowIndex && grid.editingCell?.colIndex === colIndex;
        const isSaving =
          grid.savingCell?.rowId === row.id && grid.savingCell?.columnKey === layout.key;

        const cellStyle = {
          width: layout.widthPx,
          minWidth: layout.widthPx,
          maxWidth: layout.widthPx,
        };

        const cell = (
          <EditableCell
            grid={grid}
            rowIndex={rowIndex}
            colIndex={colIndex}
            rowId={row.id}
            column={layout}
            value={value}
            isSelected={isSelected}
            isActive={isActive}
            isEditing={isEditing}
            isSaving={isSaving}
          />
        );

        if (layout.is_pinned && layout.pinLeft !== undefined) {
          return (
            <SmartsheetGridPinCell
              key={layout.id}
              pinLeft={layout.pinLeft}
              selected={isSelected}
              className="p-0"
              style={cellStyle}
            >
              {cell}
            </SmartsheetGridPinCell>
          );
        }

        return (
          <SmartsheetGridCell key={layout.id} className={cn("p-0")} style={cellStyle}>
            {cell}
          </SmartsheetGridCell>
        );
      })}
    </SmartsheetGridRow>
  );
}

const SheetGridRowMemo = memo(SheetGridRowComponent, (prev, next) => {
  if (prev.row !== next.row) {
    return false;
  }
  if (prev.columnLayout !== next.columnLayout) {
    return false;
  }
  if (prev.rowIndex !== next.rowIndex) {
    return false;
  }
  if (prev.grid.selectionEpoch !== next.grid.selectionEpoch) {
    return false;
  }

  const rowIndex = prev.rowIndex;
  const prevRowEditing =
    prev.grid.editingCell?.rowIndex === rowIndex ? prev.grid.editingCell.colIndex : -1;
  const nextRowEditing =
    next.grid.editingCell?.rowIndex === rowIndex ? next.grid.editingCell.colIndex : -1;
  if (prevRowEditing !== nextRowEditing) {
    return false;
  }

  const prevRowSaving = prev.grid.savingCell?.rowId === prev.row.id;
  const nextRowSaving = next.grid.savingCell?.rowId === next.row.id;
  if (prevRowSaving !== nextRowSaving) {
    return false;
  }

  return true;
});
