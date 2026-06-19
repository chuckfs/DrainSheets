import { parseClipboardValue } from "@/lib/sheets/clipboard";
import { normalizeRange, type CellRange, type NormalizedRange } from "@/lib/sheets/selection";
import type { Json } from "@/types/database";
import type { Row } from "@/types/domain";

export type CellUpdate = {
  rowIndex: number;
  colIndex: number;
  value: Json | undefined;
};

export function cellValuesEqual(a: Json | undefined, b: Json | undefined): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function buildClearSelectionUpdates(range: NormalizedRange): CellUpdate[] {
  const updates: CellUpdate[] = [];

  for (let rowIndex = range.minRow; rowIndex <= range.maxRow; rowIndex += 1) {
    for (let colIndex = range.minCol; colIndex <= range.maxCol; colIndex += 1) {
      updates.push({ rowIndex, colIndex, value: null });
    }
  }

  return updates;
}

export function applyLocalCellUpdatesToSparse(
  store: (Row | null)[],
  updates: CellUpdate[],
  columns: Array<{ key: string } | undefined>,
  readRowData: (row: Row) => Record<string, Json | undefined>,
): (Row | null)[] {
  return store.map((entry, rowIndex) => {
    if (!entry) {
      return entry;
    }

    const rowUpdates = updates.filter((update) => update.rowIndex === rowIndex);
    if (rowUpdates.length === 0) {
      return entry;
    }

    const nextData = { ...readRowData(entry) };
    for (const update of rowUpdates) {
      const column = columns[update.colIndex];
      if (column) {
        nextData[column.key] = update.value;
      }
    }

    return { ...entry, data: nextData as Json };
  });
}

export function applyLocalCellUpdates<T extends { data: Json }>(
  rows: T[],
  updates: CellUpdate[],
  columns: Array<{ key: string } | undefined>,
  readRowData: (row: T) => Record<string, Json | undefined>,
): T[] {
  return rows.map((entry, rowIndex) => {
    const rowUpdates = updates.filter((update) => update.rowIndex === rowIndex);
    if (rowUpdates.length === 0) {
      return entry;
    }

    const nextData = { ...readRowData(entry) };
    for (const update of rowUpdates) {
      const column = columns[update.colIndex];
      if (column) {
        nextData[column.key] = update.value;
      }
    }

    return { ...entry, data: nextData as Json };
  });
}

export function buildPasteCellUpdates(input: {
  matrix: string[][];
  startRow: number;
  startCol: number;
  columnCount: number;
}): CellUpdate[] {
  const updates: CellUpdate[] = [];

  for (let rowOffset = 0; rowOffset < input.matrix.length; rowOffset += 1) {
    const rowValues = input.matrix[rowOffset] ?? [];
    for (let colOffset = 0; colOffset < rowValues.length; colOffset += 1) {
      const rowIndex = input.startRow + rowOffset;
      const colIndex = input.startCol + colOffset;
      if (colIndex >= input.columnCount) {
        continue;
      }

      updates.push({
        rowIndex,
        colIndex,
        value: parseClipboardValue(rowValues[colOffset] ?? ""),
      });
    }
  }

  return updates;
}

export function rowsToAddForPaste(
  currentRowCount: number,
  startRow: number,
  matrixRowCount: number,
): number {
  const requiredRows = startRow + matrixRowCount;
  return Math.max(0, requiredRows - currentRowCount);
}

export function buildFillDownUpdates(input: {
  range: CellRange | NormalizedRange;
  getValue: (rowIndex: number, colIndex: number) => Json | undefined;
}): CellUpdate[] {
  const { minRow, maxRow, minCol, maxCol } =
    "start" in input.range ? normalizeRange(input.range) : input.range;

  if (maxRow <= minRow) {
    return [];
  }

  const updates: CellUpdate[] = [];

  for (let colIndex = minCol; colIndex <= maxCol; colIndex += 1) {
    const sourceValue = input.getValue(minRow, colIndex);
    for (let rowIndex = minRow + 1; rowIndex <= maxRow; rowIndex += 1) {
      updates.push({ rowIndex, colIndex, value: sourceValue });
    }
  }

  return updates;
}

export function mergeBatchServerUpdates(
  updates: CellUpdate[],
  rows: Array<{ id: string } | undefined>,
  columns: Array<{ key: string } | undefined>,
): Array<{ rowId: string; data: Record<string, Json | undefined> }> {
  const serverUpdatesMap = new Map<string, Record<string, Json | undefined>>();

  for (const update of updates) {
    const row = rows[update.rowIndex];
    const column = columns[update.colIndex];
    if (!row || !column || row.id.startsWith("temp-")) {
      continue;
    }

    const existing = serverUpdatesMap.get(row.id) ?? {};
    existing[column.key] = update.value;
    serverUpdatesMap.set(row.id, existing);
  }

  return [...serverUpdatesMap.entries()].map(([rowId, data]) => ({ rowId, data }));
}
