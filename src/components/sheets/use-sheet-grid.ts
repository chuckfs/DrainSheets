"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createColumn,
  moveColumn,
  updateColumnConfig,
  updateColumnLabel,
  updateColumnWidth,
  updateColumnPinned,
} from "@/actions/columns";
import {
  bulkDeleteRows,
  createRow,
  deleteRow,
  duplicateRow,
  reorderRow,
  updateRow,
} from "@/actions/rows";
import type { Json } from "@/types/database";
import type { ColumnType, Row, SheetColumn } from "@/types/domain";
import { buildColumnLayout, getColumnWidth, type ColumnLayout } from "@/lib/sheets/column-widths";
import type { SelectOptionConfig } from "@/lib/sheets/select-options";
import {
  getSelectedRowIndexes,
  isCellInRange,
  isSameCell,
  normalizeRange,
  type CellRange,
} from "@/lib/sheets/selection";
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
  readOnly = false,
}: {
  sheetId: string;
  initialColumns: SheetColumn[];
  initialRows: Row[];
  readOnly?: boolean;
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [rows, setRows] = useState(initialRows);
  const [selectedCell, setSelectedCell] = useState<CellCoord | null>(null);
  const [selectionRange, setSelectionRange] = useState<CellRange | null>(null);
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [savingCell, setSavingCell] = useState<{ rowId: string; columnKey: string } | null>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionEpoch, setSelectionEpoch] = useState(0);
  const [widthOverrides, setWidthOverrides] = useState<Record<string, number>>({});
  const rollbackRef = useRef<Map<string, Json | undefined>>(new Map());
  const selectionAnchorRef = useRef<CellCoord | null>(null);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    function handlePointerUp() {
      setIsSelecting(false);
    }

    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, []);

  const columnsWithWidths = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        width: widthOverrides[column.id] ?? column.width,
      })),
    [columns, widthOverrides],
  );

  const columnLayout = useMemo(() => buildColumnLayout(columnsWithWidths), [columnsWithWidths]);

  const normalizedSelection = useMemo(
    () => (selectionRange ? normalizeRange(selectionRange) : null),
    [selectionRange],
  );

  const bumpSelectionEpoch = useCallback(() => {
    setSelectionEpoch((value) => value + 1);
  }, []);

  const selectSingleCell = useCallback(
    (coord: CellCoord) => {
      setSelectedCell(coord);
      setSelectionRange({ start: coord, end: coord });
      bumpSelectionEpoch();
    },
    [bumpSelectionEpoch],
  );

  const extendSelectionTo = useCallback(
    (coord: CellCoord) => {
      const anchor = selectionAnchorRef.current ?? selectedCell ?? coord;
      setSelectedCell(coord);
      setSelectionRange({ start: anchor, end: coord });
      bumpSelectionEpoch();
    },
    [bumpSelectionEpoch, selectedCell],
  );

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

  const isCellSelected = useCallback(
    (rowIndex: number, colIndex: number) => {
      return isCellInRange(rowIndex, colIndex, selectionRange);
    },
    [selectionRange],
  );

  const isCellActive = useCallback(
    (rowIndex: number, colIndex: number) => {
      return isSameCell(selectedCell, { rowIndex, colIndex });
    },
    [selectedCell],
  );

  const navigate = useCallback(
    (direction: NavigateDirection, from?: CellCoord | null, extend = false) => {
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

      const next = {
        rowIndex: clamp(rowIndex, 0, rows.length - 1),
        colIndex: clamp(colIndex, 0, columns.length - 1),
      };

      if (extend) {
        extendSelectionTo(next);
      } else {
        selectSingleCell(next);
      }

      setEditingCell(null);
    },
    [columns.length, extendSelectionTo, rows.length, selectSingleCell, selectedCell],
  );

  const commitCell = useCallback(
    async (rowIndex: number, colIndex: number, value: Json | undefined) => {
      if (readOnly) {
        setEditingCell(null);
        return;
      }

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
    [columns, getCellValue, readOnly, rows],
  );

  const startEditing = useCallback(
    (coord: CellCoord) => {
      if (readOnly) {
        return;
      }

      setSelectedCell(coord);
      setEditingCell(coord);
    },
    [readOnly],
  );

  const stopEditing = useCallback(() => {
    setEditingCell(null);
  }, []);

  const beginSelection = useCallback(
    (coord: CellCoord, extend: boolean) => {
      if (extend && selectedCell) {
        selectionAnchorRef.current = selectionRange?.start ?? selectedCell;
        extendSelectionTo(coord);
      } else {
        selectionAnchorRef.current = coord;
        selectSingleCell(coord);
      }

      setIsSelecting(true);
    },
    [extendSelectionTo, selectSingleCell, selectedCell, selectionRange?.start],
  );

  const updateDragSelection = useCallback(
    (coord: CellCoord) => {
      if (!isSelecting) {
        return;
      }

      const anchor = selectionAnchorRef.current ?? coord;
      setSelectionRange({ start: anchor, end: coord });
      bumpSelectionEpoch();
    },
    [bumpSelectionEpoch, isSelecting],
  );

  const addRow = useCallback(async () => {
    if (readOnly || isAddingRow) {
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
    selectSingleCell({ rowIndex: rows.length, colIndex: 0 });

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
    selectSingleCell({ rowIndex: rows.length, colIndex: 0 });
  }, [isAddingRow, readOnly, rows.length, selectSingleCell, sheetId]);

  const addColumn = useCallback(
    async (label: string, type: ColumnType) => {
      if (readOnly) {
        return false;
      }

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
    [readOnly, sheetId],
  );

  const renameColumn = useCallback(async (columnId: string, label: string) => {
    if (readOnly) {
      return false;
    }

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
  }, [readOnly]);

  const reorderColumn = useCallback(async (columnId: string, direction: "left" | "right") => {
    if (readOnly) {
      return false;
    }

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
  }, [readOnly]);

  const saveSelectOptions = useCallback(async (columnId: string, options: SelectOptionConfig[]) => {
    if (readOnly) {
      return false;
    }

    const result = await updateColumnConfig(columnId, options);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    if (!result.data) {
      toast.error("Failed to save options");
      return false;
    }

    setColumns((current) => current.map((column) => (column.id === columnId ? result.data! : column)));
    return true;
  }, [readOnly]);

  const resizeColumn = useCallback((columnId: string, width: number) => {
    setWidthOverrides((current) => ({ ...current, [columnId]: width }));
  }, []);

  const persistColumnWidth = useCallback(async (columnId: string, width: number) => {
    if (readOnly) {
      return false;
    }

    const result = await updateColumnWidth(columnId, width);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    if (result.data) {
      setColumns((current) =>
        current.map((column) => (column.id === columnId ? result.data! : column)),
      );
      setWidthOverrides((current) => {
        const next = { ...current };
        delete next[columnId];
        return next;
      });
    }

    return true;
  }, [readOnly]);

  const toggleColumnPinned = useCallback(async (columnId: string, isPinned: boolean) => {
    if (readOnly) {
      return false;
    }

    setColumns((current) =>
      current.map((column) => (column.id === columnId ? { ...column, is_pinned: isPinned } : column)),
    );

    const result = await updateColumnPinned(columnId, isPinned);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    if (result.data) {
      setColumns((current) =>
        current.map((column) => (column.id === columnId ? result.data! : column)),
      );
    }

    return true;
  }, [readOnly]);

  const deleteRowById = useCallback(
    async (rowId: string) => {
      if (readOnly) {
        return false;
      }

      const previousRows = rows;
      setRows((current) => current.filter((row) => row.id !== rowId));

      const result = await deleteRow(rowId);
      if (!result.success) {
        setRows(previousRows);
        toast.error(result.error);
        return false;
      }

      setSelectionRange(null);
      setSelectedCell(null);
      bumpSelectionEpoch();
      return true;
    },
    [bumpSelectionEpoch, readOnly, rows],
  );

  const duplicateRowById = useCallback(async (rowId: string) => {
    if (readOnly) {
      return false;
    }

    const result = await duplicateRow(rowId);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    if (!result.data) {
      toast.error("Failed to duplicate row");
      return false;
    }

    setRows((current) => {
      const index = current.findIndex((row) => row.id === rowId);
      if (index < 0) {
        return [...current, result.data!].sort((a, b) => a.position - b.position);
      }

      const next = [...current];
      next.splice(index + 1, 0, result.data!);
      return next.map((row, position) => ({ ...row, position }));
    });

    return true;
  }, [readOnly]);

  const moveRowToIndex = useCallback(async (rowId: string, targetIndex: number) => {
    if (readOnly) {
      return false;
    }

    const previousRows = rows;
    const fromIndex = rows.findIndex((row) => row.id === rowId);
    if (fromIndex < 0) {
      return false;
    }

    const reordered = [...rows];
    const [moved] = reordered.splice(fromIndex, 1);
    if (!moved) {
      return false;
    }

    reordered.splice(targetIndex, 0, moved);
    setRows(reordered.map((row, position) => ({ ...row, position })));

    const result = await reorderRow(rowId, targetIndex);
    if (!result.success) {
      setRows(previousRows);
      toast.error(result.error);
      return false;
    }

    if (result.data) {
      setRows(result.data);
    }

    return true;
  }, [readOnly, rows]);

  const bulkDeleteRowsAction = useCallback(async () => {
    if (readOnly) {
      return false;
    }

    const indexes = getSelectedRowIndexes(selectionRange);
    if (indexes.length <= 1) {
      return false;
    }

    const rowIds = indexes
      .map((index) => rows[index]?.id)
      .filter((id): id is string => typeof id === "string" && !id.startsWith("temp-"));

    if (rowIds.length === 0) {
      return false;
    }

    const previousRows = rows;
    setRows((current) => current.filter((row) => !rowIds.includes(row.id)));

    const result = await bulkDeleteRows(rowIds);
    if (!result.success) {
      setRows(previousRows);
      toast.error(result.error);
      return false;
    }

    setSelectionRange(null);
    setSelectedCell(null);
    bumpSelectionEpoch();
    return true;
  }, [bumpSelectionEpoch, readOnly, rows, selectionRange]);

  const clearSelectionValues = useCallback(async () => {
    if (readOnly || !selectionRange || !normalizedSelection) {
      return false;
    }

    const { minRow, maxRow, minCol, maxCol } = normalizedSelection;
    const tasks: Array<Promise<void>> = [];

    for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex += 1) {
      for (let colIndex = minCol; colIndex <= maxCol; colIndex += 1) {
        tasks.push(commitCell(rowIndex, colIndex, null));
      }
    }

    await Promise.all(tasks);
    return true;
  }, [commitCell, normalizedSelection, readOnly, selectionRange]);

  return {
    sheetId,
    readOnly,
    columns,
    columnLayout,
    rows,
    selectedCell,
    selectionRange,
    normalizedSelection: normalizedSelection ?? {
      minRow: 0,
      maxRow: 0,
      minCol: 0,
      maxCol: 0,
    },
    editingCell,
    savingCell,
    isAddingRow,
    isSelecting,
    selectionEpoch,
    getCellValue,
    isCellSelected,
    isCellActive,
    setSelectedCell: selectSingleCell,
    beginSelection,
    updateDragSelection,
    extendSelectionTo,
    startEditing,
    stopEditing,
    commitCell,
    navigate,
    addRow,
    addColumn,
    renameColumn,
    reorderColumn,
    saveSelectOptions,
    resizeColumn,
    persistColumnWidth,
    toggleColumnPinned,
    deleteRowById,
    duplicateRowById,
    moveRowToIndex,
    bulkDeleteRows: bulkDeleteRowsAction,
    clearSelectionValues,
    getColumnWidth: (column: SheetColumn | ColumnLayout) => getColumnWidth(column),
  };
}

export type SheetGridController = ReturnType<typeof useSheetGrid>;
