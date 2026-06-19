"use client";

import { useCallback, useRef, useState } from "react";
import type { Json } from "@/types/database";
import type { Row, SheetColumn } from "@/types/domain";

const MAX_HISTORY = 50;

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

export function useSheetHistory() {
  const undoStack = useRef<SheetHistoryEntry[]>([]);
  const redoStack = useRef<SheetHistoryEntry[]>([]);
  const [, setTick] = useState(0);

  const bump = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  const push = useCallback(
    (entry: SheetHistoryEntry) => {
      undoStack.current = [...undoStack.current.slice(-(MAX_HISTORY - 1)), entry];
      redoStack.current = [];
      bump();
    },
    [bump],
  );

  const popUndo = useCallback((): SheetHistoryEntry | null => {
    const entry = undoStack.current.at(-1) ?? null;
    if (!entry) {
      return null;
    }

    undoStack.current = undoStack.current.slice(0, -1);
    redoStack.current = [...redoStack.current, entry];
    bump();
    return entry;
  }, [bump]);

  const popRedo = useCallback((): SheetHistoryEntry | null => {
    const entry = redoStack.current.at(-1) ?? null;
    if (!entry) {
      return null;
    }

    redoStack.current = redoStack.current.slice(0, -1);
    undoStack.current = [...undoStack.current, entry];
    bump();
    return entry;
  }, [bump]);

  return {
    push,
    popUndo,
    popRedo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
    undoCount: undoStack.current.length,
    redoCount: redoStack.current.length,
  };
}

export type SheetHistoryController = ReturnType<typeof useSheetHistory>;
