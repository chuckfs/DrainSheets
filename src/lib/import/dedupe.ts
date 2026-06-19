import type { ImportCellValue, ImportRow } from "./types";

export function normalizeDedupeKey(value: ImportCellValue): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value).trim().toLowerCase();
}

export function dedupeKeyForRow(row: ImportRow, sourceColumn: string | null): string | null {
  if (!sourceColumn) {
    return null;
  }

  return normalizeDedupeKey(row[sourceColumn]);
}

export type RowDedupeStatus = "unique" | "duplicate_in_file";

export function classifyRowDedupe(
  row: ImportRow,
  sourceColumn: string | null,
  seenKeys: Set<string>,
): RowDedupeStatus {
  const key = dedupeKeyForRow(row, sourceColumn);
  if (!key) {
    return "unique";
  }

  if (seenKeys.has(key)) {
    return "duplicate_in_file";
  }

  seenKeys.add(key);
  return "unique";
}

export function filterRowsWithDedupe(
  rows: ImportRow[],
  sourceColumn: string | null,
  enabled: boolean,
): { rows: ImportRow[]; duplicateCount: number } {
  if (!enabled || !sourceColumn) {
    return { rows, duplicateCount: 0 };
  }

  const seenKeys = new Set<string>();
  const kept: ImportRow[] = [];
  let duplicateCount = 0;

  for (const row of rows) {
    const status = classifyRowDedupe(row, sourceColumn, seenKeys);
    if (status === "duplicate_in_file") {
      duplicateCount += 1;
      continue;
    }
    kept.push(row);
  }

  return { rows: kept, duplicateCount };
}
