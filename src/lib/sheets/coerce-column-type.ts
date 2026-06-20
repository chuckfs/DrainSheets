import { coerceCellValue } from "@/lib/import/transform";
import type { Json } from "@/types/database";
import type { ColumnType, Row, SheetColumn } from "@/types/domain";
import { cellValuesEqual } from "@/lib/sheets/grid-operations";

function extractRowData(row: Row): Record<string, Json | undefined> {
  if (!row.data || typeof row.data !== "object" || Array.isArray(row.data)) {
    return {};
  }

  return row.data as Record<string, Json | undefined>;
}

export type ColumnCoercionPreview = {
  totalCells: number;
  changedCells: number;
};

export function previewColumnTypeCoercion(
  rows: Row[],
  column: SheetColumn,
  newType: ColumnType,
): ColumnCoercionPreview {
  let changedCells = 0;
  let totalCells = 0;

  for (const row of rows) {
    const current = extractRowData(row)[column.key];
    if (current === undefined || current === null || current === "") {
      continue;
    }

    totalCells += 1;
    const coerced = coerceCellValue(current as string | number | boolean | null, newType);
    if (!cellValuesEqual(current, coerced)) {
      changedCells += 1;
    }
  }

  return { totalCells, changedCells };
}

export function coerceColumnValues(
  rows: Row[],
  columnKey: string,
  newType: ColumnType,
): Array<{ rowId: string; data: Record<string, Json | undefined> }> {
  const updates: Array<{ rowId: string; data: Record<string, Json | undefined> }> = [];

  for (const row of rows) {
    const data = extractRowData(row);
    const current = data[columnKey];
    if (current === undefined || current === null || current === "") {
      continue;
    }

    const coerced = coerceCellValue(current as string | number | boolean | null, newType);
    if (cellValuesEqual(current, coerced)) {
      continue;
    }

    updates.push({
      rowId: row.id,
      data: { [columnKey]: coerced },
    });
  }

  return updates;
}
