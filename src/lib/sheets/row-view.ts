// Sort + filter model for a sheet's row view.
// Filtering is applied server-side (see actions/rows.ts); sorting is applied
// client-side here so it is type-aware (numbers/dates sort correctly, not as text).

import type { Json } from "@/types/database";
import type { Row, SheetColumn } from "@/types/domain";

/**
 * Hard cap on how many rows a filtered/sorted view loads into the client at once.
 * Normal scrolling/browsing is windowed (listRowsWindow) and has no cap; this only
 * bounds a single sort/filter "view" so it stays responsive and memory-safe.
 */
export const ROW_VIEW_CAP = 5000;

export type RowFilterOperator =
  | "contains"
  | "equals"
  | "not_equals"
  | "is_empty"
  | "is_not_empty";

export const ROW_FILTER_OPERATORS: {
  value: RowFilterOperator;
  label: string;
  needsValue: boolean;
}[] = [
  { value: "contains", label: "contains", needsValue: true },
  { value: "equals", label: "is", needsValue: true },
  { value: "not_equals", label: "is not", needsValue: true },
  { value: "is_empty", label: "is empty", needsValue: false },
  { value: "is_not_empty", label: "is not empty", needsValue: false },
];

export type RowFilterCondition = {
  columnKey: string;
  operator: RowFilterOperator;
  value: string;
};

export type RowSortDirection = "asc" | "desc";
export type RowSort = { columnKey: string; direction: RowSortDirection };

export function isRowViewActive(sort: RowSort | null, filters: RowFilterCondition[]): boolean {
  return sort !== null || filters.length > 0;
}

function rawCell(row: Row, key: string): Json | undefined {
  const data = row.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return undefined;
  }
  return (data as Record<string, Json | undefined>)[key];
}

function isEmptyCell(value: Json | undefined): boolean {
  return value === null || value === undefined || value === "";
}

function numericValue(value: Json | undefined): number {
  const parsed = parseFloat(String(value).replace(/[^0-9.\-]/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function compareNonEmpty(
  a: Json | undefined,
  b: Json | undefined,
  type: SheetColumn["type"],
): number {
  switch (type) {
    case "number":
    case "currency":
      return numericValue(a) - numericValue(b);
    case "date": {
      const da = Date.parse(String(a));
      const db = Date.parse(String(b));
      return (Number.isNaN(da) ? 0 : da) - (Number.isNaN(db) ? 0 : db);
    }
    case "checkbox":
      return (a ? 1 : 0) - (b ? 1 : 0);
    default:
      return String(a).localeCompare(String(b), undefined, {
        numeric: true,
        sensitivity: "base",
      });
  }
}

/** Returns a new array sorted by the given column. Empty cells always sort last. */
export function sortRows(rows: Row[], sort: RowSort, columns: SheetColumn[]): Row[] {
  const column = columns.find((candidate) => candidate.key === sort.columnKey);
  if (!column) {
    return rows;
  }
  const direction = sort.direction === "asc" ? 1 : -1;

  return [...rows].sort((rowA, rowB) => {
    const a = rawCell(rowA, sort.columnKey);
    const b = rawCell(rowB, sort.columnKey);
    const aEmpty = isEmptyCell(a);
    const bEmpty = isEmptyCell(b);
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1; // empties last regardless of direction
    if (bEmpty) return -1;
    return compareNonEmpty(a, b, column.type) * direction;
  });
}
