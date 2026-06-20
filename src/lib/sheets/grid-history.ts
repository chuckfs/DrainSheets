import type { Json } from "@/types/database";
import type { Row } from "@/types/domain";
import type {
  BatchCellHistoryEntry,
  CellHistoryEntry,
  ColumnRenameHistoryEntry,
} from "@/lib/sheets/sheet-history-stack";
import type { CellUpdate } from "@/lib/sheets/grid-operations";

export function extractRowData(row: Row): Record<string, Json | undefined> {
  if (row.data && typeof row.data === "object" && !Array.isArray(row.data)) {
    return row.data as Record<string, Json | undefined>;
  }

  return {};
}

export function resolveColumnRenameLabel(
  entry: ColumnRenameHistoryEntry,
  direction: "undo" | "redo",
): string {
  return direction === "undo" ? entry.before : entry.after;
}

export function insertRowAtIndex<T>(rows: T[], row: T, index: number): T[] {
  const next = [...rows];
  next.splice(index, 0, row);
  return next;
}

export function buildSingleCellHistoryEntry(
  update: { rowIndex: number; colIndex: number; value: Json | undefined },
  rows: Array<{ id: string } | undefined>,
  columns: Array<{ key: string } | undefined>,
  beforeValue: Json | undefined,
): CellHistoryEntry | null {
  const row = rows[update.rowIndex];
  const column = columns[update.colIndex];
  if (!row || !column || row.id.startsWith("temp-")) {
    return null;
  }

  return {
    type: "cell",
    rowId: row.id,
    columnKey: column.key,
    before: beforeValue,
    after: update.value,
  };
}

export function buildBatchCellHistoryEntry(
  updates: CellUpdate[],
  rows: Array<{ id: string } | undefined>,
  columns: Array<{ key: string } | undefined>,
  getBeforeValue: (rowIndex: number, colIndex: number) => Json | undefined,
): BatchCellHistoryEntry | null {
  const cells: CellHistoryEntry[] = [];

  for (const update of updates) {
    const entry = buildSingleCellHistoryEntry(update, rows, columns, getBeforeValue(update.rowIndex, update.colIndex));
    if (entry) {
      cells.push(entry);
    }
  }

  if (cells.length === 0) {
    return null;
  }

  return { type: "batch_cell", cells };
}
