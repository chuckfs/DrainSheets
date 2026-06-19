"use client";

import { memo, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Json } from "@/types/database";
import { EmptyState } from "@/components/ui/empty-state";
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

const ROW_HEIGHT = 32;

export function SheetGrid({
  grid,
  onOpenRow,
}: {
  grid: SheetGridController;
  onOpenRow?: (rowId: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { columnLayout, totalRowCount, selectedCell } = grid;

  const rowVirtualizer = useVirtualizer({
    count: totalRowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) {
      return;
    }

    void grid.ensureRowsLoaded(virtualItems[0]!.index, virtualItems.at(-1)!.index);
  }, [grid.ensureRowsLoaded, rowVirtualizer.range?.startIndex, rowVirtualizer.range?.endIndex, totalRowCount]);

  useEffect(() => {
    if (!selectedCell || !gridRef.current) {
      return;
    }

    rowVirtualizer.scrollToIndex(selectedCell.rowIndex, { align: "auto" });

    const selector = `[data-row-index="${selectedCell.rowIndex}"][data-col-index="${selectedCell.colIndex}"]`;
    const element = gridRef.current.querySelector<HTMLElement>(selector);
    element?.focus();
  }, [rowVirtualizer, selectedCell]);

  if (columnLayout.length === 0) {
    return (
      <SmartsheetGridEmpty message="This sheet has no columns yet. Use Add column to create one." />
    );
  }

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-rowcount={totalRowCount}
      aria-colcount={columnLayout.length}
    >
      <div ref={scrollRef} className="max-h-[calc(100vh-12rem)] overflow-auto">
        <SmartsheetGrid className="overflow-visible border-x border-b">
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
            {totalRowCount === 0 ? (
              <SmartsheetGridRow>
                <SmartsheetGridCell colSpan={columnLayout.length + 1} className="p-0">
                  <EmptyState
                    title="No rows yet"
                    description="Add your first row to start tracking data in this sheet."
                  />
                </SmartsheetGridCell>
              </SmartsheetGridRow>
            ) : (
              <>
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr
                    aria-hidden
                    style={{ height: rowVirtualizer.getVirtualItems()[0]?.start ?? 0 }}
                  />
                )}
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = grid.getRowAt(virtualRow.index);
                  if (!row) {
                    return (
                      <LoadingGridRow
                        key={`loading-${virtualRow.index}`}
                        rowIndex={virtualRow.index}
                        columnLayout={columnLayout}
                      />
                    );
                  }

                  return (
                    <SheetGridRowMemo
                      key={row.id}
                      row={row}
                      rowIndex={virtualRow.index}
                      columnLayout={columnLayout}
                      grid={grid}
                      onOpenRow={onOpenRow}
                    />
                  );
                })}
                {rowVirtualizer.getVirtualItems().length > 0 && (
                  <tr
                    aria-hidden
                    style={{
                      height:
                        rowVirtualizer.getTotalSize() -
                        (rowVirtualizer.getVirtualItems().at(-1)?.end ?? 0),
                    }}
                  />
                )}
              </>
            )}
          </SmartsheetGridBody>
        </SmartsheetGrid>
      </div>
    </div>
  );
}

function LoadingGridRow({
  rowIndex,
  columnLayout,
}: {
  rowIndex: number;
  columnLayout: ColumnLayout[];
}) {
  return (
    <SmartsheetGridRow aria-busy="true">
      <SmartsheetGridPinCell
        pinLeft={0}
        className="p-0"
        style={{ width: ROW_NUMBER_WIDTH, minWidth: ROW_NUMBER_WIDTH, height: ROW_HEIGHT }}
      >
        <div className="flex h-8 items-center justify-center text-xs text-muted-foreground">
          {rowIndex + 1}
        </div>
      </SmartsheetGridPinCell>
      {columnLayout.map((layout) => (
        <SmartsheetGridCell
          key={layout.id}
          className="p-0"
          style={{
            width: layout.widthPx,
            minWidth: layout.widthPx,
            maxWidth: layout.widthPx,
            height: ROW_HEIGHT,
          }}
        >
          <div className="h-8 animate-pulse bg-muted/40" />
        </SmartsheetGridCell>
      ))}
    </SmartsheetGridRow>
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
  onOpenRow?: (rowId: string) => void;
};

function SheetGridRowComponent({ row, rowIndex, columnLayout, grid, onOpenRow }: SheetGridRowProps) {
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
        <RowNumberCell grid={grid} rowIndex={rowIndex} rowId={row.id} onOpenRow={onOpenRow} />
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
