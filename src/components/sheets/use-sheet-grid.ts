"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createColumn, moveColumn, updateColumnLabel } from "@/actions/columns";
import { createRow, updateRow } from "@/actions/rows";
import type { Json } from "@/types/database";
import type { ColumnType, Row, SheetColumn } from "@/types/domain";
import { toast } from "sonner";
import type { NavigateDirection } from "./cell-renderers/types";

export type CellCoord = { rowIndex: number; colIndex: number };

function parseRowData(row: Row): Record<string, Json | undefined> {
  if (row.data && typeof row.data === "object" && !Array.isArray(row.data)) {
    return row.data as Record<string, Json | undefined>;
  }

  return {};
}

function valuesEqual(a: Json | undefined, b: Json | undefined): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function useSheetGrid({
  sheetId,
  initialColumns,
  initialRows,
}: {
  sheetId: string;
  initialColumns: SheetColumn[];
  initialRows: Row[];
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [rows, setRows] = useState(initialRows);
  const [selectedCell, setSelectedCell] = useState<CellCoord | null>(null);
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [savingCell, setSavingCell] = useState<{ rowId: string; columnKey: string } | null>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const rollbackRef = useRef<Map<string, Json | undefined>>(new Map());

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const getCellValue = useCallback(
    (rowIndex: number, colIndex: number): Json | undefined => {
      const row = rows[rowIndex];
      const column = columns[colIndex];
      if (!row || !column) {
        return undefined;
      }

      return parseRowData(row)[column.key];
    },
    [columns, rows],
  );

  const navigate = useCallback(
    (direction: NavigateDirection, from?: CellCoord | null) => {
      if (columns.length === 0 || rows.length === 0) {
        return;
      }

      const base = from ?? selectedCell ?? { rowIndex: 0, colIndex: 0 };
      let { rowIndex, colIndex } = base;

      switch (direction) {
        case "up":
          rowIndex -= 1;
          break;
        case "down":
          rowIndex += 1;
          break;
        case "left":
          colIndex -= 1;
          break;
        case "right":
          colIndex += 1;
          break;
        case "next":
          colIndex += 1;
          if (colIndex >= columns.length) {
            colIndex = 0;
            rowIndex += 1;
          }
          break;
        case "prev":
          colIndex -= 1;
          if (colIndex < 0) {
            colIndex = columns.length - 1;
            rowIndex -= 1;
          }
          break;
      }

      setSelectedCell({
        rowIndex: clamp(rowIndex, 0, rows.length - 1),
        colIndex: clamp(colIndex, 0, columns.length - 1),
      });
      setEditingCell(null);
    },
    [columns.length, rows.length, selectedCell],
  );

  const commitCell = useCallback(
    async (rowIndex: number, colIndex: number, value: Json | undefined) => {
      const row = rows[rowIndex];
      const column = columns[colIndex];
      if (!row || !column || row.id.startsWith("temp-")) {
        setEditingCell(null);
        return;
      }

      const previous = getCellValue(rowIndex, colIndex);
      if (valuesEqual(previous, value)) {
        setEditingCell(null);
        return;
      }

      const rollbackKey = `${row.id}:${column.key}`;
      rollbackRef.current.set(rollbackKey, previous);

      setRows((current) =>
        current.map((entry, index) => {
          if (index !== rowIndex) {
            return entry;
          }

          return {
            ...entry,
            data: {
              ...parseRowData(entry),
              [column.key]: value,
            },
          };
        }),
      );
      setSavingCell({ rowId: row.id, columnKey: column.key });
      setEditingCell(null);

      const result = await updateRow(row.id, { [column.key]: value });
      setSavingCell(null);

      if (!result.success) {
        const rollbackValue = rollbackRef.current.get(rollbackKey);
        setRows((current) =>
          current.map((entry, index) => {
            if (index !== rowIndex) {
              return entry;
            }

            return {
              ...entry,
              data: {
                ...parseRowData(entry),
                [column.key]: rollbackValue,
              },
            };
          }),
        );
        toast.error(result.error);
        return;
      }

      if (result.data) {
        setRows((current) =>
          current.map((entry, index) => (index === rowIndex ? result.data! : entry)),
        );
      }
    },
    [columns, getCellValue, rows],
  );

  const startEditing = useCallback((coord: CellCoord) => {
    setSelectedCell(coord);
    setEditingCell(coord);
  }, []);

  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  const addRow = useCallback(async () => {
    if (isAddingRow) {
      return;
    }

    setIsAddingRow(true);
    const tempId = `temp-${Date.now()}`;
    const optimisticRow: Row = {
      id: tempId,
      sheet_id: sheetId,
      org_id: "",
      position: rows.length,
      data: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      search_vector: null,
    };

    setRows((current) => [...current, optimisticRow]);
    setSelectedCell({ rowIndex: rows.length, colIndex: 0 });

    const result = await createRow(sheetId, {});
    setIsAddingRow(false);

    if (!result.success) {
      setRows((current) => current.filter((row) => row.id !== tempId));
      toast.error(result.error);
      return;
    }

    if (!result.data) {
      setRows((current) => current.filter((row) => row.id !== tempId));
      toast.error("Failed to add row");
      return;
    }

    setRows((current) => current.map((row) => (row.id === tempId ? result.data! : row)));
    setSelectedCell({ rowIndex: rows.length, colIndex: 0 });
  }, [isAddingRow, rows.length, sheetId]);

  const addColumn = useCallback(
    async (label: string, type: ColumnType) => {
      const result = await createColumn(sheetId, label, type);
      if (!result.success) {
        toast.error(result.error);
        return false;
      }

      if (!result.data) {
        toast.error("Failed to add column");
        return false;
      }

      const newColumn = result.data;
      setColumns((current) => [...current, newColumn].sort((a, b) => a.position - b.position));
      return true;
    },
    [sheetId],
  );

  const renameColumn = useCallback(async (columnId: string, label: string) => {
    const result = await updateColumnLabel(columnId, label);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    if (!result.data) {
      toast.error("Failed to rename column");
      return false;
    }

    const updatedColumn = result.data;
    setColumns((current) =>
      current.map((column) => (column.id === columnId ? updatedColumn : column)),
    );
    return true;
  }, []);

  const reorderColumn = useCallback(async (columnId: string, direction: "left" | "right") => {
    const result = await moveColumn(columnId, direction);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    if (!result.data) {
      toast.error("Failed to reorder column");
      return false;
    }

    setColumns(result.data);
    return true;
  }, []);

  return {
    columns,
    rows,
    selectedCell,
    editingCell,
    savingCell,
    isAddingRow,
    getCellValue,
    setSelectedCell,
    startEditing,
    stopEditing,
    commitCell,
    navigate,
    addRow,
    addColumn,
    renameColumn,
    reorderColumn,
  };
}

export type SheetGridController = ReturnType<typeof useSheetGrid>;
