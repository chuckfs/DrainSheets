"use client";

import { useEffect, useRef } from "react";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";
import { ColumnHeader } from "@/components/sheets/column-header";
import { EditableCell } from "@/components/sheets/editable-cell";
import type { Row, SheetColumn } from "@/types/domain";
import type { SheetGridController } from "./use-sheet-grid";

export function SheetGrid({
  grid,
}: {
  grid: SheetGridController;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const { columns, rows, selectedCell } = grid;

  useEffect(() => {
    if (!selectedCell || !gridRef.current) {
      return;
    }

    const selector = `[data-row-index="${selectedCell.rowIndex}"][data-col-index="${selectedCell.colIndex}"]`;
    const element = gridRef.current.querySelector<HTMLElement>(selector);
    element?.focus();
  }, [selectedCell]);

  if (columns.length === 0) {
    return (
      <SmartsheetGridEmpty message="This sheet has no columns yet. Use Add column to create one." />
    );
  }

  return (
    <div ref={gridRef} role="grid" aria-rowcount={rows.length} aria-colcount={columns.length}>
      <SmartsheetGrid>
        <SmartsheetGridHeader>
          <SmartsheetGridRow>
            <SmartsheetGridHead className="w-10 text-center">#</SmartsheetGridHead>
            {columns.map((column, columnIndex) => (
              <SmartsheetGridHead
                key={column.id}
                style={column.width ? { minWidth: column.width } : { minWidth: 140 }}
              >
                <ColumnHeader
                  column={column}
                  columnIndex={columnIndex}
                  columnCount={columns.length}
                  grid={grid}
                />
              </SmartsheetGridHead>
            ))}
          </SmartsheetGridRow>
        </SmartsheetGridHeader>
        <SmartsheetGridBody>
          {rows.length === 0 ? (
            <SmartsheetGridRow>
              <SmartsheetGridCell
                colSpan={columns.length + 1}
                className="py-8 text-center text-muted-foreground"
              >
                No rows yet. Use Add row to create one.
              </SmartsheetGridCell>
            </SmartsheetGridRow>
          ) : (
            rows.map((row, rowIndex) => (
              <SheetGridRow
                key={row.id}
                row={row}
                rowIndex={rowIndex}
                columns={columns}
                grid={grid}
              />
            ))
          )}
        </SmartsheetGridBody>
      </SmartsheetGrid>
    </div>
  );
}

function SheetGridRow({
  row,
  rowIndex,
  columns,
  grid,
}: {
  row: Row;
  rowIndex: number;
  columns: SheetColumn[];
  grid: SheetGridController;
}) {
  return (
    <SmartsheetGridRow>
      <SmartsheetGridCell className="w-10 text-center text-muted-foreground tabular-nums">
        {rowIndex + 1}
      </SmartsheetGridCell>
      {columns.map((column, colIndex) => (
        <SmartsheetGridCell key={column.id} className="p-0">
          <EditableCell
            grid={grid}
            rowIndex={rowIndex}
            colIndex={colIndex}
            rowId={row.id}
            column={column}
            value={grid.getCellValue(rowIndex, colIndex)}
          />
        </SmartsheetGridCell>
      ))}
    </SmartsheetGridRow>
  );
}
