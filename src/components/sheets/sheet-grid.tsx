"use client";

import { memo, useMemo } from "react";
import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Rows3Icon } from "lucide-react";
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
import { DEFAULT_ROW_HEIGHT } from "@/lib/sheets/row-heights";
import type { ColumnLayout } from "@/lib/sheets/column-widths";
import type { Row } from "@/types/domain";
import { cn } from "@/lib/utils";
import { ColumnHeader } from "@/components/sheets/column-header";
import { EditableCell, RowNumberCell } from "@/components/sheets/editable-cell";
import type { SheetGridController } from "./use-sheet-grid";

const ROW_HEIGHT = DEFAULT_ROW_HEIGHT;

export function SheetGrid({
  grid,
  onOpenRow,
}: {
  grid: SheetGridController;
  onOpenRow?: (rowId: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { columnLayout, totalRowCount, selectedCell, showHiddenRows, showHiddenColumns } = grid;

  const visibleRowIndexes = useMemo(() => {
    const indexes: number[] = [];
    for (let index = 0; index < totalRowCount; index += 1) {
      const row = grid.getRowAt(index);
      if (showHiddenRows || !row?.is_hidden) {
        indexes.push(index);
      }
    }
    return indexes;
  }, [grid, showHiddenRows, totalRowCount, grid.rows]);

  const rowVirtualizer = useVirtualizer({
    count: visibleRowIndexes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const rowIndex = visibleRowIndexes[index];
      return rowIndex === undefined ? ROW_HEIGHT : grid.getRowHeight(rowIndex);
    },
    overscan: 12,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [grid.rowHeightEpoch, rowVirtualizer]);

  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    if (virtualItems.length === 0) {
      return;
    }

    const first = visibleRowIndexes[virtualItems[0]!.index];
    const last = visibleRowIndexes[virtualItems.at(-1)!.index];
    if (first === undefined || last === undefined) {
      return;
    }

    void grid.ensureRowsLoaded(first, last);
  }, [grid.ensureRowsLoaded, rowVirtualizer.range?.startIndex, rowVirtualizer.range?.endIndex, visibleRowIndexes]);

  useEffect(() => {
    if (!selectedCell || !gridRef.current) {
      return;
    }

    const visibleIndex = visibleRowIndexes.indexOf(selectedCell.rowIndex);
    if (visibleIndex < 0) {
      return;
    }

    rowVirtualizer.scrollToIndex(visibleIndex, { align: "auto" });

    const selector = `[data-row-index="${selectedCell.rowIndex}"][data-col-index="${selectedCell.colIndex}"]`;
    const element = gridRef.current.querySelector<HTMLElement>(selector);
    element?.focus();
  }, [rowVirtualizer, selectedCell, visibleRowIndexes]);

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
              {columnLayout.map((layout, columnIndex) => {
                const column = grid.columns[columnIndex];
                if (!showHiddenColumns && column?.is_hidden) {
                  return null;
                }

                return (
                <ColumnHeadCell
                  key={layout.id}
                  layout={layout}
                  columnIndex={columnIndex}
                  columnCount={columnLayout.length}
                  grid={grid}
                />
                );
              })}
            </SmartsheetGridRow>
          </SmartsheetGridHeader>
          <SmartsheetGridBody>
            {totalRowCount === 0 ? (
              <SmartsheetGridRow>
                <SmartsheetGridCell colSpan={columnLayout.length + 1} className="p-0">
                  <EmptyState
                    icon={Rows3Icon}
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
                  const rowIndex = visibleRowIndexes[virtualRow.index];
                  if (rowIndex === undefined) {
                    return null;
                  }

                  const row = grid.getRowAt(rowIndex);
                  if (!row) {
                    return (
                      <LoadingGridRow
                        key={`loading-${rowIndex}`}
                        rowIndex={rowIndex}
                        columnLayout={columnLayout}
                        grid={grid}
                      />
                    );
                  }

                  return (
                    <SheetGridRowMemo
                      key={row.id}
                      row={row}
                      rowIndex={rowIndex}
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
  grid,
}: {
  rowIndex: number;
  columnLayout: ColumnLayout[];
  grid: SheetGridController;
}) {
  const rowHeight = grid.getRowHeight(rowIndex);

  return (
    <SmartsheetGridRow style={{ height: rowHeight, minHeight: rowHeight }} className="!h-auto" aria-busy="true">
      <SmartsheetGridPinCell
        pinLeft={0}
        className="p-0"
        style={{ width: ROW_NUMBER_WIDTH, minWidth: ROW_NUMBER_WIDTH, height: rowHeight }}
      >
        <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height: rowHeight }}>
          {rowIndex + 1}
        </div>
      </SmartsheetGridPinCell>
      {columnLayout.map((layout, columnIndex) => {
        const column = grid.columns[columnIndex];
        if (!grid.showHiddenColumns && column?.is_hidden) {
          return null;
        }

        return (
        <SmartsheetGridCell
          key={layout.id}
          className="p-0"
          style={{
            width: layout.widthPx,
            minWidth: layout.widthPx,
            maxWidth: layout.widthPx,
            height: rowHeight,
          }}
        >
          <div className="animate-pulse bg-muted/40" style={{ height: rowHeight }} />
        </SmartsheetGridCell>
        );
      })}
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
  const rowHeight = grid.getRowHeight(rowIndex);
  const rowData =
    row.data && typeof row.data === "object" && !Array.isArray(row.data)
      ? (row.data as Record<string, Json | undefined>)
      : {};

  return (
    <SmartsheetGridRow style={{ height: rowHeight, minHeight: rowHeight }} className="!h-auto">
      <SmartsheetGridPinCell
        pinLeft={0}
        className="p-0"
        style={{ width: ROW_NUMBER_WIDTH, minWidth: ROW_NUMBER_WIDTH, height: rowHeight }}
      >
        <RowNumberCell grid={grid} rowIndex={rowIndex} rowId={row.id} onOpenRow={onOpenRow} />
      </SmartsheetGridPinCell>
      {columnLayout.map((layout, colIndex) => {
        const column = grid.columns[colIndex];
        if (!grid.showHiddenColumns && column?.is_hidden) {
          return null;
        }

        const value = rowData[layout.key];
        const isSelected = grid.isCellSelected(rowIndex, colIndex);
        const isActive = grid.isCellActive(rowIndex, colIndex);
        const isEditing =
          grid.editingCell?.rowIndex === rowIndex && grid.editingCell?.colIndex === colIndex;
        const isSaving =
          grid.savingCell?.rowId === row.id && grid.savingCell?.columnKey === layout.key;
        const cellFormatting = grid.getCellStyle(rowIndex, colIndex);

        const cellStyle = {
          width: layout.widthPx,
          minWidth: layout.widthPx,
          maxWidth: layout.widthPx,
          height: rowHeight,
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
            cellStyle={cellFormatting}
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
  if (prev.row.height !== next.row.height) {
    return false;
  }
  if (prev.grid.rowHeightEpoch !== next.grid.rowHeightEpoch) {
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
