"use client";

import { useCallback, useRef, useState } from "react";
import {
  SheetHistoryStack,
  type SheetHistoryEntry,
} from "@/lib/sheets/sheet-history-stack";

export type {
  CellHistoryEntry,
  ColumnAddHistoryEntry,
  ColumnRenameHistoryEntry,
  RowAddHistoryEntry,
  RowDeleteHistoryEntry,
  SheetHistoryEntry,
} from "@/lib/sheets/sheet-history-stack";

export function useSheetHistory() {
  const stackRef = useRef(new SheetHistoryStack());
  const [, setTick] = useState(0);

  const bump = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  const push = useCallback(
    (entry: SheetHistoryEntry) => {
      stackRef.current.push(entry);
      bump();
    },
    [bump],
  );

  const popUndo = useCallback((): SheetHistoryEntry | null => {
    const entry = stackRef.current.popUndo();
    bump();
    return entry;
  }, [bump]);

  const popRedo = useCallback((): SheetHistoryEntry | null => {
    const entry = stackRef.current.popRedo();
    bump();
    return entry;
  }, [bump]);

  return {
    push,
    popUndo,
    popRedo,
    get canUndo() {
      return stackRef.current.canUndo;
    },
    get canRedo() {
      return stackRef.current.canRedo;
    },
    get undoCount() {
      return stackRef.current.undoCount;
    },
    get redoCount() {
      return stackRef.current.redoCount;
    },
  };
}

export type SheetHistoryController = ReturnType<typeof useSheetHistory>;
