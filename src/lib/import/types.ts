import type { ColumnType } from "@/types/domain";

export type ImportCellValue = string | number | boolean | null | undefined;

export type ImportRow = Record<string, ImportCellValue>;

export type ParsedImport = {
  fileName: string;
  columns: string[];
  rows: ImportRow[];
};

export type ParseImportResult =
  | { success: true; data: ParsedImport }
  | { success: false; error: string };

export type InferredColumn = {
  sourceHeader: string;
  key: string;
  label: string;
  type: ColumnType;
  position: number;
  isPrimary: boolean;
};

export type ColumnMappingEntry = {
  sourceHeader: string;
  targetKey: string | null;
  typeOverride?: ColumnType;
};

export type DedupeConfig = {
  enabled: boolean;
  sourceColumn: string | null;
};

export type ImportPreviewSummary = {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  skippedRows: number;
  previewRows: Array<Record<string, ImportCellValue>>;
  columnCount: number;
};

export type ImportMode = "freeform" | "template";

export const IMPORT_PREVIEW_LIMIT = 20;
