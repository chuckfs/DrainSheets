"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createColumn,
  deleteColumn as deleteColumnAction,
  moveColumn,
  unhideAllColumns as unhideAllColumnsOnServer,
  updateColumnConfig,
  updateColumnHidden,
  updateColumnLabel,
  updateColumnNumericConfig,
  updateColumnType,
  updateColumnWidth,
  updateColumnPinned,
} from "@/actions/columns";
import {
  bulkDeleteRows,
  batchUpdateRowStyles,
  batchUpdateRows,
  createRow,
  deleteRow,
  duplicateRow,
  listRowsWindow,
  reorderRow,
  unhideAllRows as unhideAllRowsOnServer,
  updateRow,
  updateRowHidden,
  updateRowHeight,
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
import { buildFillDownUpdates, buildFillFromCellUpdates, applyLocalCellUpdatesToSparse, cellValuesEqual, mergeBatchServerUpdates } from "@/lib/sheets/grid-operations";
import {
  buildBatchCellHistoryEntry,
  buildSingleCellHistoryEntry,
  extractRowData,
  resolveColumnRenameLabel,
} from "@/lib/sheets/grid-history";
import { computeNavigateCoord } from "@/lib/sheets/grid-navigation";
import {
  appendSparseRow,
  computeLoadRange,
  createSparseRowStore,
  insertSparseRow,
  invalidateStoreRange,
  isRangeLoaded,
  mergeRowsIntoStore,
  moveSparseRow,
  spliceSparseRow,
} from "@/lib/sheets/row-window";
import {
  resolveHistoryCellValue,
  resolveHistoryStyleValue,
  type BatchCellHistoryEntry,
  type CellHistoryEntry,
  type StyleHistoryEntry,
} from "@/lib/sheets/sheet-history-stack";
import { useSheetHistory, type SheetHistoryEntry } from "./use-sheet-history";
import { useSheetSync } from "./use-sheet-sync";
import { getColumnDecimals } from "@/lib/sheets/column-config";
import { previewColumnTypeCoercion } from "@/lib/sheets/coerce-column-type";
import {
  clampRowHeight,
  getRowHeight as getRowHeightFromRow,
  normalizeRowHeightForStorage,
} from "@/lib/sheets/row-heights";
import {
  getCellStyleFromRow,
  mergeCellStyle,
  normalizeCellStyle,
  parseRowStyles,
  setCellStyleOnRow,
  styleToHistoryJson,
  type CellAlign,
  type CellStyle,
} from "@/lib/sheets/cell-style";

export type CellCoord = { rowIndex: number; colIndex: number };

export type FormattingToggleState = boolean | "mixed";

export type FormattingState = {
  bold: FormattingToggleState;
  italic: FormattingToggleState;
  underline: FormattingToggleState;
  align: CellAlign | "mixed" | null;
  color: string | "mixed" | null;
  backgroundColor: string | "mixed" | null;
};

function parseRowData(row: Row): Record<string, Json | undefined> {
  return extractRowData(row);
}

export function useSheetGrid({
  sheetId,
  initialColumns,
  initialRows,
  initialRowCount,
  readOnly = false,
}: {
  sheetId: string;
  initialColumns: SheetColumn[];
  initialRows: Row[];
  initialRowCount: number;
  readOnly?: boolean;
}) {
  const [columns, setColumns] = useState(initialColumns);
  const [rows, setRows] = useState<(Row | null)[]>(() =>
    createSparseRowStore(initialRowCount, initialRows),
  );
  const [totalRowCount, setTotalRowCount] = useState(initialRowCount);
  const rowsRef = useRef<(Row | null)[]>(rows);
  const loadingWindowsRef = useRef<Set<number>>(new Set());
  const [selectedCell, setSelectedCell] = useState<CellCoord | null>(null);
  const [selectionRange, setSelectionRange] = useState<CellRange | null>(null);
  const [editingCell, setEditingCell] = useState<CellCoord | null>(null);
  const [savingCell, setSavingCell] = useState<{ rowId: string; columnKey: string } | null>(null);
  const [isAddingRow, setIsAddingRow] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionEpoch, setSelectionEpoch] = useState(0);
  const [widthOverrides, setWidthOverrides] = useState<Record<string, number>>({});
  const [heightOverrides, setHeightOverrides] = useState<Record<string, number>>({});
  const [rowHeightEpoch, setRowHeightEpoch] = useState(0);
  const rollbackRef = useRef<Map<string, Json | undefined>>(new Map());
  const selectionAnchorRef = useRef<CellCoord | null>(null);
  const history = useSheetHistory();
  const skipHistoryRef = useRef(false);
  const { syncState, beginSave, endSave } = useSheetSync();
  const [showHiddenRows, setShowHiddenRows] = useState(false);
  const [showHiddenColumns, setShowHiddenColumns] = useState(false);

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    setRows(createSparseRowStore(initialRowCount, initialRows));
    setTotalRowCount(initialRowCount);
  }, [initialRowCount, initialRows]);

  const ensureRowsLoaded = useCallback(
    async (startIndex: number, endIndex: number) => {
      const range = computeLoadRange(startIndex, endIndex, totalRowCount);
      if (!range) {
        return;
      }

      if (isRangeLoaded(rowsRef.current, range.offset, range.offset + range.limit - 1)) {
        return;
      }

      if (loadingWindowsRef.current.has(range.offset)) {
        return;
      }

      loadingWindowsRef.current.add(range.offset);
      try {
        const fetched = await listRowsWindow(sheetId, range.offset, range.limit);
        setRows((current) => mergeRowsIntoStore(current, fetched, range.offset));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load rows");
      } finally {
        loadingWindowsRef.current.delete(range.offset);
      }
    },
    [sheetId, totalRowCount],
  );

  const refreshRowsRange = useCallback(
    async (startIndex: number, endIndex: number) => {
      setRows((current) => invalidateStoreRange(current, startIndex, endIndex));
      await ensureRowsLoaded(startIndex, endIndex);
    },
    [ensureRowsLoaded],
  );

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

  const getRowHeight = useCallback(
    (rowIndex: number): number => {
      const row = rowsRef.current[rowIndex];
      if (!row) {
        return getRowHeightFromRow(null);
      }

      const override = heightOverrides[row.id];
      if (override !== undefined) {
        return override;
      }

      return getRowHeightFromRow(row);
    },
    [heightOverrides],
  );

  const bumpRowHeightEpoch = useCallback(() => {
    setRowHeightEpoch((value) => value + 1);
  }, []);

  const resizeRowHeight = useCallback(
    (rowId: string, height: number) => {
      const clamped = clampRowHeight(height);
      setHeightOverrides((current) => ({ ...current, [rowId]: clamped }));
      bumpRowHeightEpoch();
    },
    [bumpRowHeightEpoch],
  );

  const persistRowHeight = useCallback(
    async (rowId: string, height: number) => {
      if (readOnly || rowId.startsWith("temp-")) {
        return false;
      }

      const storedHeight = normalizeRowHeightForStorage(height);
      const rowIndex = rowsRef.current.findIndex((row) => row?.id === rowId);
      const previousRow = rowIndex >= 0 ? rowsRef.current[rowIndex] : null;

      setRows((current) =>
        current.map((row) =>
          row?.id === rowId ? { ...row, height: storedHeight } : row,
        ),
      );
      bumpRowHeightEpoch();

      beginSave();
      const result = await updateRowHeight(rowId, storedHeight);
      if (!result.success) {
        endSave(false);
        if (previousRow && rowIndex >= 0) {
          setRows((current) =>
            current.map((row, index) => (index === rowIndex ? previousRow : row)),
          );
          bumpRowHeightEpoch();
        }
        toast.error(result.error);
        return false;
      }

      endSave(true);
      setHeightOverrides((current) => {
        const next = { ...current };
        delete next[rowId];
        return next;
      });

      if (result.data && rowIndex >= 0) {
        setRows((current) =>
          current.map((row, index) => (index === rowIndex ? result.data! : row)),
        );
      }

      return true;
    },
    [beginSave, bumpRowHeightEpoch, endSave, readOnly],
  );

  const getRowAt = useCallback((rowIndex: number): Row | null => {
    return rowsRef.current[rowIndex] ?? null;
  }, []);

  const isRowLoaded = useCallback((rowIndex: number): boolean => {
    return rowsRef.current[rowIndex] !== null && rowsRef.current[rowIndex] !== undefined;
  }, []);

  const getCellValue = useCallback(
    (rowIndex: number, colIndex: number): Json | undefined => {
      const row = rowsRef.current[rowIndex];
      const column = columns[colIndex];
      if (!row || !column) {
        return undefined;
      }

      return parseRowData(row)[column.key];
    },
    [columns],
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
    async (direction: NavigateDirection, from?: CellCoord | null, extend = false) => {
      if (columns.length === 0 || totalRowCount === 0) {
        return;
      }

      const base = from ?? selectedCell ?? { rowIndex: 0, colIndex: 0 };
      const next = computeNavigateCoord({
        direction,
        from: base,
        rowCount: totalRowCount,
        columnCount: columns.length,
      });

      await ensureRowsLoaded(next.rowIndex, next.rowIndex);

      if (extend) {
        extendSelectionTo(next);
      } else {
        selectSingleCell(next);
      }

      setEditingCell(null);
    },
    [
      columns.length,
      ensureRowsLoaded,
      extendSelectionTo,
      selectSingleCell,
      selectedCell,
      totalRowCount,
    ],
  );

  const commitCell = useCallback(
    async (rowIndex: number, colIndex: number, value: Json | undefined) => {
      if (readOnly) {
        setEditingCell(null);
        return;
      }

      const row = rowsRef.current[rowIndex];
      const column = columns[colIndex];
      if (!row || !column || row.id.startsWith("temp-")) {
        setEditingCell(null);
        return;
      }

      const previous = getCellValue(rowIndex, colIndex);
      if (cellValuesEqual(previous, value)) {
        setEditingCell(null);
        return;
      }

      const rollbackKey = `${row.id}:${column.key}`;
      rollbackRef.current.set(rollbackKey, previous);

      setRows((current) =>
        current.map((entry, index) => {
          if (index !== rowIndex || !entry) {
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
      beginSave();

      const result = await updateRow(row.id, { [column.key]: value });
      setSavingCell(null);

      if (!result.success) {
        endSave(false);
        const rollbackValue = rollbackRef.current.get(rollbackKey);
        setRows((current) =>
          current.map((entry, index) => {
            if (index !== rowIndex || !entry) {
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

      endSave(true);

      if (!skipHistoryRef.current) {
        history.push({
          type: "cell",
          rowId: row.id,
          columnKey: column.key,
          before: previous,
          after: value,
        });
      }

      if (result.data) {
        setRows((current) =>
          current.map((entry, index) => (index === rowIndex ? result.data! : entry)),
        );
      }
    },
    [beginSave, columns, endSave, getCellValue, history, readOnly],
  );

  const batchCommitCells = useCallback(
    async (
      updates: Array<{ rowIndex: number; colIndex: number; value: Json | undefined }>,
      options?: { activityLabel?: string; recordHistory?: boolean },
    ) => {
      if (readOnly || updates.length === 0) {
        return false;
      }

      const minRow = Math.min(...updates.map((update) => update.rowIndex));
      const maxRow = Math.max(...updates.map((update) => update.rowIndex));
      await ensureRowsLoaded(minRow, maxRow);

      const currentRows = rowsRef.current;
      const denseRows = currentRows.map((row) => row ?? undefined);
      const serverUpdates = mergeBatchServerUpdates(updates, denseRows, columns);

      if (serverUpdates.length === 0) {
        return false;
      }

      let historyEntry: CellHistoryEntry | BatchCellHistoryEntry | null = null;
      if (options?.recordHistory !== false) {
        if (updates.length === 1) {
          const only = updates[0]!;
          historyEntry = buildSingleCellHistoryEntry(
            only,
            denseRows,
            columns,
            getCellValue(only.rowIndex, only.colIndex),
          );
        } else {
          historyEntry = buildBatchCellHistoryEntry(updates, denseRows, columns, getCellValue);
        }
      }

      setRows((current) => applyLocalCellUpdatesToSparse(current, updates, columns, parseRowData));

      beginSave();
      const result = await batchUpdateRows(serverUpdates, {
        operation: options?.activityLabel ?? "batch_update",
        sheetId,
      });

      if (!result.success) {
        endSave(false);
        toast.error(result.error);
        return false;
      }

      endSave(true);

      if (historyEntry) {
        history.push(historyEntry);
      }

      return true;
    },
    [beginSave, columns, endSave, ensureRowsLoaded, getCellValue, history, readOnly, sheetId],
  );

  const addRows = useCallback(
    async (count: number) => {
      if (readOnly || count <= 0) {
        return false;
      }

      for (let index = 0; index < count; index += 1) {
        const result = await createRow(sheetId, {});
        if (!result.success || !result.data) {
          toast.error(!result.success ? result.error : "Failed to add row");
          return false;
        }

        setRows((current) => appendSparseRow(current, result.data!));
        setTotalRowCount((count) => count + 1);
        if (!skipHistoryRef.current) {
          history.push({ type: "row_add", row: result.data });
        }
      }

      return true;
    },
    [history, readOnly, sheetId],
  );

  const fillFromCell = useCallback(
    async (source: CellCoord, targetEndRow: number) => {
      if (readOnly || targetEndRow <= source.rowIndex) {
        return false;
      }

      await ensureRowsLoaded(source.rowIndex, targetEndRow);

      if (targetEndRow >= totalRowCount) {
        const rowsNeeded = targetEndRow - totalRowCount + 1;
        const added = await addRows(rowsNeeded);
        if (!added) {
          return false;
        }
      }

      const updates = buildFillFromCellUpdates({
        sourceRow: source.rowIndex,
        sourceCol: source.colIndex,
        targetEndRow,
        getValue: getCellValue,
      });

      if (updates.length === 0) {
        return false;
      }

      return batchCommitCells(updates, { activityLabel: "fill_down", recordHistory: true });
    },
    [addRows, batchCommitCells, ensureRowsLoaded, getCellValue, readOnly, totalRowCount],
  );

  const fillDown = useCallback(async () => {
    if (readOnly) {
      return false;
    }

    if (!selectionRange && selectedCell) {
      return fillFromCell(selectedCell, selectedCell.rowIndex + 1);
    }

    if (!selectionRange) {
      return false;
    }

    const range = normalizedSelection ?? normalizeRange(selectionRange);
    if (range.maxRow <= range.minRow && range.maxCol === range.minCol && selectedCell) {
      return fillFromCell(selectedCell, selectedCell.rowIndex + 1);
    }

    await ensureRowsLoaded(range.minRow, range.maxRow);
    const updates = buildFillDownUpdates({ range, getValue: getCellValue });
    if (updates.length === 0) {
      return false;
    }

    return batchCommitCells(updates, { activityLabel: "fill_down", recordHistory: true });
  }, [
    batchCommitCells,
    ensureRowsLoaded,
    fillFromCell,
    getCellValue,
    normalizedSelection,
    readOnly,
    selectedCell,
    selectionRange,
  ]);

  const getFormattingSelectionCells = useCallback(() => {
    const range =
      normalizedSelection ??
      (selectedCell
        ? normalizeRange({ start: selectedCell, end: selectedCell })
        : null);

    if (!range) {
      return [] as Array<{ rowIndex: number; colIndex: number; row: Row; column: SheetColumn }>;
    }

    const cells: Array<{ rowIndex: number; colIndex: number; row: Row; column: SheetColumn }> = [];
    for (let rowIndex = range.minRow; rowIndex <= range.maxRow; rowIndex += 1) {
      for (let colIndex = range.minCol; colIndex <= range.maxCol; colIndex += 1) {
        const row = rowsRef.current[rowIndex];
        const column = columns[colIndex];
        if (row && column) {
          cells.push({ rowIndex, colIndex, row, column });
        }
      }
    }

    return cells;
  }, [columns, normalizedSelection, selectedCell]);

  const getCellStyle = useCallback(
    (rowIndex: number, colIndex: number): CellStyle => {
      const row = rowsRef.current[rowIndex];
      const column = columns[colIndex];
      if (!row || !column) {
        return {};
      }

      return getCellStyleFromRow(row, column.key);
    },
    [columns],
  );

  const getFormattingState = useCallback((): FormattingState => {
    const cells = getFormattingSelectionCells();
    if (cells.length === 0) {
      return {
        bold: false,
        italic: false,
        underline: false,
        align: null,
        color: null,
        backgroundColor: null,
      };
    }

    function collect<T>(values: T[]): T | "mixed" {
      const first = values[0]!;
      for (const value of values) {
        if (value !== first) {
          return "mixed";
        }
      }
      return first;
    }

    const styles = cells.map((cell) => getCellStyleFromRow(cell.row, cell.column.key));

    return {
      bold: collect(styles.map((style) => style.bold === true)),
      italic: collect(styles.map((style) => style.italic === true)),
      underline: collect(styles.map((style) => style.underline === true)),
      align: collect(styles.map((style) => style.align ?? null)),
      color: collect(styles.map((style) => style.color ?? null)),
      backgroundColor: collect(styles.map((style) => style.backgroundColor ?? null)),
    };
  }, [getFormattingSelectionCells]);

  const applyStyleChanges = useCallback(
    async (
      buildNextStyle: (current: CellStyle) => CellStyle | null,
      options?: { recordHistory?: boolean },
    ) => {
      if (readOnly) {
        return false;
      }

      const cells = getFormattingSelectionCells();
      if (cells.length === 0) {
        return false;
      }

      const minRow = Math.min(...cells.map((cell) => cell.rowIndex));
      const maxRow = Math.max(...cells.map((cell) => cell.rowIndex));
      await ensureRowsLoaded(minRow, maxRow);

      const historyCells: StyleHistoryEntry[] = [];
      const rowUpdates = new Map<string, Row>();

      for (const cell of cells) {
        const currentRow = rowUpdates.get(cell.row.id) ?? cell.row;
        const beforeStyle = getCellStyleFromRow(currentRow, cell.column.key);
        const nextStyle = buildNextStyle(beforeStyle);
        const updatedRow = setCellStyleOnRow(currentRow, cell.column.key, nextStyle);
        const before = styleToHistoryJson(beforeStyle);
        const after = styleToHistoryJson(nextStyle);

        if (JSON.stringify(before) !== JSON.stringify(after)) {
          historyCells.push({
            rowId: cell.row.id,
            columnKey: cell.column.key,
            before,
            after,
          });
        }

        rowUpdates.set(cell.row.id, updatedRow);
      }

      if (historyCells.length === 0) {
        return true;
      }

      setRows((current) =>
        current.map((row) => {
          if (!row) {
            return row;
          }

          const updated = rowUpdates.get(row.id);
          return updated ?? row;
        }),
      );

      beginSave();
      const result = await batchUpdateRowStyles(
        Array.from(rowUpdates.entries()).map(([rowId, row]) => ({
          rowId,
          styles: parseRowStyles(row.styles) as Record<string, Json>,
        })),
        { sheetId },
      );

      if (!result.success) {
        endSave(false);
        toast.error(result.error);
        return false;
      }

      endSave(true);

      if (options?.recordHistory !== false) {
        history.push({ type: "batch_style", cells: historyCells });
      }

      return true;
    },
    [
      beginSave,
      endSave,
      ensureRowsLoaded,
      getFormattingSelectionCells,
      history,
      readOnly,
      sheetId,
    ],
  );

  const applyStyleHistoryCells = useCallback(
    async (cells: StyleHistoryEntry[], direction: "undo" | "redo") => {
      const ordered = direction === "undo" ? [...cells].reverse() : cells;
      const rowUpdates = new Map<string, Row>();

      for (const cell of ordered) {
        const rowIndex = rowsRef.current.findIndex((row) => row?.id === cell.rowId);
        if (rowIndex < 0) {
          continue;
        }

        const currentRow = rowUpdates.get(cell.rowId) ?? rowsRef.current[rowIndex]!;
        const styleJson = resolveHistoryStyleValue(cell, direction);
        const style =
          styleJson && typeof styleJson === "object" && !Array.isArray(styleJson)
            ? normalizeCellStyle(styleJson as Record<string, unknown>)
            : null;
        rowUpdates.set(cell.rowId, setCellStyleOnRow(currentRow, cell.columnKey, style));
      }

      if (rowUpdates.size === 0) {
        return;
      }

      setRows((current) =>
        current.map((row) => {
          if (!row) {
            return row;
          }

          const updated = rowUpdates.get(row.id);
          return updated ?? row;
        }),
      );

      beginSave();
      const result = await batchUpdateRowStyles(
        Array.from(rowUpdates.entries()).map(([rowId, row]) => ({
          rowId,
          styles: parseRowStyles(row.styles) as Record<string, Json>,
        })),
        { sheetId },
      );

      if (!result.success) {
        endSave(false);
        toast.error(result.error);
        return;
      }

      endSave(true);
    },
    [beginSave, endSave, sheetId],
  );

  const applyFormattingPatch = useCallback(
    async (patch: Partial<CellStyle>) => {
      return applyStyleChanges((current) => mergeCellStyle(current, patch));
    },
    [applyStyleChanges],
  );

  const toggleFormatting = useCallback(
    async (field: "bold" | "italic" | "underline") => {
      const state = getFormattingState();
      const current = state[field];
      const next = current === true ? false : true;
      return applyFormattingPatch({ [field]: next });
    },
    [applyFormattingPatch, getFormattingState],
  );

  const clearFormatting = useCallback(async () => {
    return applyStyleChanges(() => null);
  }, [applyStyleChanges]);

  const applyHistoryEntry = useCallback(
    async (entry: SheetHistoryEntry, direction: "undo" | "redo") => {
      skipHistoryRef.current = true;

      try {
        if (entry.type === "cell") {
          const rowIndex = rowsRef.current.findIndex((row) => row?.id === entry.rowId);
          const colIndex = columns.findIndex((column) => column.key === entry.columnKey);
          if (rowIndex < 0 || colIndex < 0) {
            return;
          }

          const value = resolveHistoryCellValue(entry, direction);
          await commitCell(rowIndex, colIndex, value);
          return;
        }

        if (entry.type === "batch_cell") {
          const cells = direction === "undo" ? [...entry.cells].reverse() : entry.cells;
          for (const cell of cells) {
            const rowIndex = rowsRef.current.findIndex((row) => row?.id === cell.rowId);
            const colIndex = columns.findIndex((column) => column.key === cell.columnKey);
            if (rowIndex < 0 || colIndex < 0) {
              continue;
            }
            const value = resolveHistoryCellValue(cell, direction);
            await commitCell(rowIndex, colIndex, value);
          }
          return;
        }

        if (entry.type === "batch_style") {
          await applyStyleHistoryCells(entry.cells, direction);
          return;
        }

        if (entry.type === "row_add") {
          if (direction === "undo") {
            await deleteRow(entry.row.id);
            const index = rowsRef.current.findIndex((row) => row?.id === entry.row.id);
            if (index >= 0) {
              setRows((current) => spliceSparseRow(current, index));
            }
            setTotalRowCount((count) => count - 1);
          } else {
            const rowData = extractRowData(entry.row);
            const result = await createRow(sheetId, rowData);
            if (!result.success || !result.data) {
              toast.error(!result.success ? result.error : "Failed to restore row");
              return;
            }
            setRows((current) => appendSparseRow(current, result.data!));
            setTotalRowCount((count) => count + 1);
          }
          return;
        }

        if (entry.type === "row_delete") {
          if (direction === "undo") {
            const rowData = extractRowData(entry.row);
            const result = await createRow(sheetId, rowData);
            if (!result.success || !result.data) {
              toast.error(!result.success ? result.error : "Failed to restore row");
              return;
            }

            setRows((current) => insertSparseRow(current, entry.index, result.data!));
            setTotalRowCount((count) => count + 1);
          } else {
            await deleteRow(entry.row.id);
            const index = rowsRef.current.findIndex((row) => row?.id === entry.row.id);
            if (index >= 0) {
              setRows((current) => spliceSparseRow(current, index));
            }
            setTotalRowCount((count) => count - 1);
          }
          return;
        }

        if (entry.type === "column_add") {
          if (direction === "undo") {
            await deleteColumnAction(entry.column.id);
            setColumns((current) => current.filter((column) => column.id !== entry.column.id));
          } else {
            setColumns((current) => [...current, entry.column]);
          }
          return;
        }

        if (entry.type === "column_rename") {
          const label = resolveColumnRenameLabel(entry, direction);
          await updateColumnLabel(entry.columnId, label);
          setColumns((current) =>
            current.map((column) =>
              column.id === entry.columnId ? { ...column, label } : column,
            ),
          );
        }
      } finally {
        skipHistoryRef.current = false;
      }
    },
    [applyStyleHistoryCells, columns, commitCell, sheetId],
  );

  const undo = useCallback(async () => {
    const entry = history.popUndo();
    if (!entry) {
      return false;
    }

    await applyHistoryEntry(entry, "undo");
    return true;
  }, [applyHistoryEntry, history]);

  const redo = useCallback(async () => {
    const entry = history.popRedo();
    if (!entry) {
      return false;
    }

    await applyHistoryEntry(entry, "redo");
    return true;
  }, [applyHistoryEntry, history]);

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

  const clearSelection = useCallback(() => {
    setSelectionRange(null);
    setSelectedCell(null);
    setEditingCell(null);
    selectionAnchorRef.current = null;
    bumpSelectionEpoch();
  }, [bumpSelectionEpoch]);

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
    const newRowIndex = totalRowCount;
    const optimisticRow: Row = {
      id: tempId,
      sheet_id: sheetId,
      org_id: "",
      position: newRowIndex,
      data: {},
      is_hidden: false,
      height: null,
      styles: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      search_vector: null,
    };

    setRows((current) => appendSparseRow(current, optimisticRow));
    setTotalRowCount((count) => count + 1);
    selectSingleCell({ rowIndex: newRowIndex, colIndex: 0 });

    const result = await createRow(sheetId, {});
    setIsAddingRow(false);

    if (!result.success) {
      setRows((current) => spliceSparseRow(current, newRowIndex));
      setTotalRowCount((count) => count - 1);
      toast.error(result.error);
      return;
    }

    if (!result.data) {
      setRows((current) => spliceSparseRow(current, newRowIndex));
      setTotalRowCount((count) => count - 1);
      toast.error("Failed to add row");
      return;
    }

    if (!skipHistoryRef.current) {
      history.push({ type: "row_add", row: result.data });
    }

    setRows((current) =>
      current.map((row, index) => (index === newRowIndex && row?.id === tempId ? result.data! : row)),
    );
    selectSingleCell({ rowIndex: newRowIndex, colIndex: 0 });
  }, [history, isAddingRow, readOnly, selectSingleCell, sheetId, totalRowCount]);

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
      if (!skipHistoryRef.current) {
        history.push({ type: "column_add", column: newColumn });
      }
      return true;
    },
    [history, readOnly, sheetId],
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
    if (!skipHistoryRef.current) {
      const previous = columns.find((column) => column.id === columnId);
      if (previous && previous.label !== updatedColumn.label) {
        history.push({
          type: "column_rename",
          columnId,
          before: previous.label,
          after: updatedColumn.label,
        });
      }
    }
    return true;
  }, [columns, history, readOnly]);

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

      const previousRows = rowsRef.current;
      const previousCount = totalRowCount;
      const deletedIndex = rowsRef.current.findIndex((row) => row?.id === rowId);
      const deletedRow = rowsRef.current[deletedIndex];
      if (deletedIndex < 0) {
        return false;
      }

      setRows((current) => spliceSparseRow(current, deletedIndex));
      setTotalRowCount((count) => count - 1);

      const result = await deleteRow(rowId);
      if (!result.success) {
        setRows(previousRows);
        setTotalRowCount(previousCount);
        toast.error(result.error);
        return false;
      }

      if (deletedRow && !skipHistoryRef.current) {
        history.push({ type: "row_delete", row: deletedRow, index: deletedIndex });
      }

      const nextCount = totalRowCount - 1;
      await refreshRowsRange(deletedIndex, Math.max(deletedIndex, nextCount - 1));
      setSelectionRange(null);
      setSelectedCell(null);
      bumpSelectionEpoch();
      return true;
    },
    [bumpSelectionEpoch, history, readOnly, refreshRowsRange, totalRowCount],
  );

  const deleteColumnById = useCallback(
    async (columnId: string) => {
      if (readOnly) {
        return false;
      }

      const previousColumns = columns;
      const previousRows = rowsRef.current;
      const target = columns.find((column) => column.id === columnId);
      if (!target) {
        return false;
      }

      setColumns((current) => current.filter((column) => column.id !== columnId));
      setRows((current) =>
        current.map((row) => {
          if (!row) {
            return row;
          }

          const data = { ...parseRowData(row) };
          delete data[target.key];
          return { ...row, data };
        }),
      );

      const result = await deleteColumnAction(columnId);
      if (!result.success) {
        setColumns(previousColumns);
        setRows(previousRows);
        toast.error(result.error);
        return false;
      }

      return true;
    },
    [columns, readOnly],
  );

  const duplicateRowById = useCallback(
    async (rowId: string) => {
      if (readOnly) {
        return false;
      }

      const sourceIndex = rowsRef.current.findIndex((row) => row?.id === rowId);
      const result = await duplicateRow(rowId);
      if (!result.success) {
        toast.error(result.error);
        return false;
      }

      if (!result.data) {
        toast.error("Failed to duplicate row");
        return false;
      }

      const insertIndex = sourceIndex >= 0 ? sourceIndex + 1 : totalRowCount;
      const nextCount = totalRowCount + 1;
      setRows((current) => insertSparseRow(current, insertIndex, result.data!));
      setTotalRowCount(nextCount);
      await refreshRowsRange(insertIndex, nextCount - 1);
      return true;
    },
    [readOnly, refreshRowsRange, totalRowCount],
  );

  const moveRowToIndex = useCallback(
    async (rowId: string, targetIndex: number) => {
      if (readOnly) {
        return false;
      }

      const previousRows = rowsRef.current;
      const fromIndex = rowsRef.current.findIndex((row) => row?.id === rowId);
      if (fromIndex < 0) {
        return false;
      }

      setRows((current) => moveSparseRow(current, fromIndex, targetIndex));

      const result = await reorderRow(rowId, targetIndex);
      if (!result.success) {
        setRows(previousRows);
        toast.error(result.error);
        return false;
      }

      const refreshStart = Math.min(fromIndex, targetIndex);
      await refreshRowsRange(refreshStart, totalRowCount - 1);
      return true;
    },
    [readOnly, refreshRowsRange, totalRowCount],
  );

  const insertRowAt = useCallback(
    async (index: number) => {
      if (readOnly) {
        return false;
      }

      const result = await createRow(sheetId, {});
      if (!result.success || !result.data) {
        toast.error(!result.success ? result.error : "Failed to insert row");
        return false;
      }

      const newRow = result.data;
      const endIndex = totalRowCount;
      setRows((current) => insertSparseRow(current, endIndex, newRow));
      setTotalRowCount((count) => count + 1);

      if (index < endIndex) {
        await moveRowToIndex(newRow.id, index);
      }

      if (!skipHistoryRef.current) {
        history.push({ type: "row_add", row: newRow });
      }

      return true;
    },
    [history, moveRowToIndex, readOnly, sheetId, totalRowCount],
  );

  const freezeColumnsThrough = useCallback(
    async (columnIndex: number) => {
      if (readOnly) {
        return false;
      }

      const tasks = columns.map((column, index) =>
        toggleColumnPinned(column.id, index <= columnIndex),
      );
      await Promise.all(tasks);
      return true;
    },
    [columns, readOnly, toggleColumnPinned],
  );

  const unfreezeAllColumns = useCallback(async () => {
    if (readOnly) {
      return false;
    }

    await Promise.all(
      columns.filter((column) => column.is_pinned).map((column) => toggleColumnPinned(column.id, false)),
    );
    return true;
  }, [columns, readOnly, toggleColumnPinned]);

  const bulkDeleteRowsAction = useCallback(async () => {
    if (readOnly) {
      return false;
    }

    const indexes = getSelectedRowIndexes(selectionRange);
    if (indexes.length <= 1) {
      return false;
    }

    const rowIds = indexes
      .map((index) => rowsRef.current[index]?.id)
      .filter((id): id is string => typeof id === "string" && !id.startsWith("temp-"));

    if (rowIds.length === 0) {
      return false;
    }

    const previousRows = rowsRef.current;
    const previousCount = totalRowCount;
    const sortedIndexes = [...indexes].sort((left, right) => right - left);

    const refreshStart = Math.min(...indexes);

    setRows((current) => {
      let next = current;
      for (const index of sortedIndexes) {
        next = spliceSparseRow(next, index);
      }
      return next;
    });
    setTotalRowCount((count) => count - rowIds.length);

    const result = await bulkDeleteRows(rowIds);
    if (!result.success) {
      setRows(previousRows);
      setTotalRowCount(previousCount);
      toast.error(result.error);
      return false;
    }

    const nextCount = totalRowCount - rowIds.length;
    await refreshRowsRange(refreshStart, Math.max(refreshStart, nextCount - 1));
    setSelectionRange(null);
    setSelectedCell(null);
    bumpSelectionEpoch();
    return true;
  }, [bumpSelectionEpoch, readOnly, refreshRowsRange, selectionRange, totalRowCount]);

  const clearSelectionValues = useCallback(async () => {
    if (readOnly || !selectionRange || !normalizedSelection) {
      return false;
    }

    const { minRow, maxRow, minCol, maxCol } = normalizedSelection;
    await ensureRowsLoaded(minRow, maxRow);
    const tasks: Array<Promise<void>> = [];

    for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex += 1) {
      for (let colIndex = minCol; colIndex <= maxCol; colIndex += 1) {
        tasks.push(commitCell(rowIndex, colIndex, null));
      }
    }

    await Promise.all(tasks);
    return true;
  }, [commitCell, ensureRowsLoaded, normalizedSelection, readOnly, selectionRange]);

  const getActiveColumn = useCallback((): SheetColumn | null => {
    if (selectedCell) {
      return columns[selectedCell.colIndex] ?? null;
    }

    if (selectionRange) {
      return columns[selectionRange.start.colIndex] ?? null;
    }

    return null;
  }, [columns, selectedCell, selectionRange]);

  const hideColumnById = useCallback(
    async (columnId: string) => {
      if (readOnly) {
        return false;
      }

      setColumns((current) =>
        current.map((column) => (column.id === columnId ? { ...column, is_hidden: true } : column)),
      );
      beginSave();
      const result = await updateColumnHidden(columnId, true);
      if (!result.success) {
        endSave(false);
        toast.error(result.error);
        return false;
      }

      endSave(true);
      if (result.data) {
        setColumns((current) =>
          current.map((column) => (column.id === columnId ? result.data! : column)),
        );
      }
      return true;
    },
    [beginSave, endSave, readOnly],
  );

  const unhideAllColumns = useCallback(async () => {
    if (readOnly) {
      return false;
    }

    setColumns((current) => current.map((column) => ({ ...column, is_hidden: false })));
    beginSave();
    const result = await unhideAllColumnsOnServer(sheetId);
    if (!result.success) {
      endSave(false);
      toast.error(result.error);
      return false;
    }

    endSave(true);
    return true;
  }, [beginSave, endSave, readOnly, sheetId]);

  const hideRowById = useCallback(
    async (rowId: string) => {
      if (readOnly) {
        return false;
      }

      const rowIndex = rowsRef.current.findIndex((row) => row?.id === rowId);
      setRows((current) =>
        current.map((row) => (row?.id === rowId ? { ...row, is_hidden: true } : row)),
      );
      beginSave();
      const result = await updateRowHidden(rowId, true);
      if (!result.success) {
        endSave(false);
        toast.error(result.error);
        return false;
      }

      endSave(true);
      if (result.data && rowIndex >= 0) {
        setRows((current) =>
          current.map((row, index) => (index === rowIndex ? result.data! : row)),
        );
      }
      return true;
    },
    [beginSave, endSave, readOnly],
  );

  const unhideAllRows = useCallback(async () => {
    if (readOnly) {
      return false;
    }

    setRows((current) => current.map((row) => (row ? { ...row, is_hidden: false } : row)));
    beginSave();
    const result = await unhideAllRowsOnServer(sheetId);
    if (!result.success) {
      endSave(false);
      toast.error(result.error);
      return false;
    }

    endSave(true);
    return true;
  }, [beginSave, endSave, readOnly, sheetId]);

  const updateColumnDecimals = useCallback(
    async (columnId: string, decimals: number) => {
      if (readOnly) {
        return false;
      }

      beginSave();
      const result = await updateColumnNumericConfig(columnId, decimals);
      if (!result.success) {
        endSave(false);
        toast.error(result.error);
        return false;
      }

      endSave(true);
      if (result.data) {
        setColumns((current) =>
          current.map((column) => (column.id === columnId ? result.data! : column)),
        );
      }
      return true;
    },
    [beginSave, endSave, readOnly],
  );

  const changeColumnType = useCallback(
    async (columnId: string, type: ColumnType) => {
      if (readOnly) {
        return false;
      }

      beginSave();
      const result = await updateColumnType(columnId, type);
      if (!result.success) {
        endSave(false);
        toast.error(result.error);
        return false;
      }

      endSave(true);
      if (result.data) {
        setColumns((current) =>
          current.map((column) => (column.id === columnId ? result.data! : column)),
        );
        await refreshRowsRange(0, Math.max(0, totalRowCount - 1));
      }
      return true;
    },
    [beginSave, endSave, readOnly, refreshRowsRange, totalRowCount],
  );

  const previewTypeChange = useCallback(
    (columnId: string, type: ColumnType) => {
      const column = columns.find((entry) => entry.id === columnId);
      if (!column) {
        return { totalCells: 0, changedCells: 0 };
      }

      const loadedRows = rowsRef.current.filter((row): row is Row => row !== null);
      return previewColumnTypeCoercion(loadedRows, column, type);
    },
    [columns],
  );

  return {
    sheetId,
    readOnly,
    columns,
    columnLayout,
    rows,
    totalRowCount,
    ensureRowsLoaded,
    getRowAt,
    isRowLoaded,
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
    batchCommitCells,
    addRows,
    fillDown,
    fillFromCell,
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    deleteColumnById,
    insertRowAt,
    freezeColumnsThrough,
    unfreezeAllColumns,
    clearSelection,
    getColumnWidth: (column: SheetColumn | ColumnLayout) => getColumnWidth(column),
    syncState,
    showHiddenRows,
    showHiddenColumns,
    setShowHiddenRows,
    setShowHiddenColumns,
    getActiveColumn,
    hideColumnById,
    unhideAllColumns,
    hideRowById,
    unhideAllRows,
    updateColumnDecimals,
    changeColumnType,
    previewTypeChange,
    getColumnDecimals,
    getCellStyle,
    getFormattingState,
    applyFormattingPatch,
    toggleFormatting,
    clearFormatting,
    getRowHeight,
    resizeRowHeight,
    persistRowHeight,
    rowHeightEpoch,
  };
}

export type SheetGridController = ReturnType<typeof useSheetGrid>;
