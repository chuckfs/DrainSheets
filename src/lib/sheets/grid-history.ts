import type { Json } from "@/types/database";
import type { Row } from "@/types/domain";
import type {
  CellHistoryEntry,
  ColumnRenameHistoryEntry,
} from "@/lib/sheets/sheet-history-stack";

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
