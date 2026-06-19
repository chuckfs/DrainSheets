import type { Json } from "@/types/database";
import type { Row, SheetColumn } from "@/types/domain";

export const MAX_SHEET_HISTORY = 50;

export type CellHistoryEntry = {
  type: "cell";
  rowId: string;
  columnKey: string;
  before: Json | undefined;
  after: Json | undefined;
};

export type RowAddHistoryEntry = {
  type: "row_add";
  row: Row;
};

export type RowDeleteHistoryEntry = {
  type: "row_delete";
  row: Row;
  index: number;
};

export type ColumnAddHistoryEntry = {
  type: "column_add";
  column: SheetColumn;
};

export type ColumnRenameHistoryEntry = {
  type: "column_rename";
  columnId: string;
  before: string;
  after: string;
};

export type SheetHistoryEntry =
  | CellHistoryEntry
  | RowAddHistoryEntry
  | RowDeleteHistoryEntry
  | ColumnAddHistoryEntry
  | ColumnRenameHistoryEntry;

export class SheetHistoryStack {
  private undoStack: SheetHistoryEntry[] = [];
  private redoStack: SheetHistoryEntry[] = [];

  push(entry: SheetHistoryEntry): void {
    this.undoStack = [...this.undoStack.slice(-(MAX_SHEET_HISTORY - 1)), entry];
    this.redoStack = [];
  }

  popUndo(): SheetHistoryEntry | null {
    const entry = this.undoStack.at(-1) ?? null;
    if (!entry) {
      return null;
    }

    this.undoStack = this.undoStack.slice(0, -1);
    this.redoStack = [...this.redoStack, entry];
    return entry;
  }

  popRedo(): SheetHistoryEntry | null {
    const entry = this.redoStack.at(-1) ?? null;
    if (!entry) {
      return null;
    }

    this.redoStack = this.redoStack.slice(0, -1);
    this.undoStack = [...this.undoStack, entry];
    return entry;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoCount(): number {
    return this.undoStack.length;
  }

  get redoCount(): number {
    return this.redoStack.length;
  }
}

export function resolveHistoryCellValue(
  entry: CellHistoryEntry,
  direction: "undo" | "redo",
): Json | undefined {
  return direction === "undo" ? entry.before : entry.after;
}
