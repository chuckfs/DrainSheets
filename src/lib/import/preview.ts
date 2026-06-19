import type { ColumnType } from "@/types/domain";
import { filterRowsWithDedupe } from "./dedupe";
import { isRowEmpty, mapRowToSheetData } from "./transform";
import type { ColumnMappingEntry, ImportCellValue, ImportPreviewSummary, ImportRow } from "./types";
import { IMPORT_PREVIEW_LIMIT } from "./types";

export function buildImportPreview(input: {
  rows: ImportRow[];
  mapping: Record<string, ColumnMappingEntry>;
  columnTypes: Record<string, ColumnType>;
  dedupe: { enabled: boolean; sourceColumn: string | null };
}): ImportPreviewSummary {
  const { rows: dedupedRows, duplicateCount } = filterRowsWithDedupe(
    input.rows,
    input.dedupe.sourceColumn,
    input.dedupe.enabled,
  );

  let validRows = 0;
  let invalidRows = 0;
  const previewRows: Array<Record<string, ImportCellValue>> = [];

  for (const row of dedupedRows) {
    const data = mapRowToSheetData(row, input.mapping, input.columnTypes);
    if (isRowEmpty(data)) {
      invalidRows += 1;
      continue;
    }

    validRows += 1;
    if (previewRows.length < IMPORT_PREVIEW_LIMIT) {
      const preview: Record<string, ImportCellValue> = {};
      for (const [key, value] of Object.entries(data)) {
        preview[key] = value === undefined ? null : (value as ImportCellValue);
      }
      previewRows.push(preview);
    }
  }

  const mappedColumnCount = new Set(
    Object.values(input.mapping)
      .map((entry) => entry.targetKey)
      .filter(Boolean),
  ).size;

  return {
    totalRows: input.rows.length,
    validRows,
    duplicateRows: duplicateCount,
    invalidRows,
    skippedRows: duplicateCount + invalidRows,
    previewRows,
    columnCount: mappedColumnCount,
  };
}
