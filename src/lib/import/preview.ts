import {
  dedupeKeyForRecord,
  normalizeDedupeKey,
  type RowDedupeStatus,
} from "@/lib/import/dedupe";
import type { ColumnMapping } from "@/lib/import/mapping";
import { mapRowToRecord } from "@/lib/import/normalizers";
import type { ImportRow } from "@/lib/import/parser";
import type { ImportMode, ImportTemplate } from "@/lib/validations/import";
import { validateImportRecord } from "@/lib/validations/import";

export type PreviewRowStatus = "valid" | "warning" | "invalid" | "skipped";

export type ImportPreviewRow = {
  rowIndex: number;
  status: PreviewRowStatus;
  dedupeStatus: RowDedupeStatus;
  message?: string;
  record: Record<string, string>;
};

export type ImportPreviewSummary = {
  totalRows: number;
  validRows: number;
  warningRows: number;
  invalidRows: number;
  skippedRows: number;
  duplicateRows: number;
  rows: ImportPreviewRow[];
};

const PREVIEW_LIMIT = 25;

export function buildImportPreview(params: {
  mode: ImportMode;
  rows: ImportRow[];
  mapping: ColumnMapping;
  template?: ImportTemplate;
  existingKeys: string[];
  skipDuplicates: boolean;
}): ImportPreviewSummary {
  const { mode, rows, mapping, template = "none", existingKeys, skipDuplicates } = params;
  const existingKeySet = new Set(existingKeys.map(normalizeDedupeKey));
  const seenInFile = new Set<string>();

  let validRows = 0;
  let warningRows = 0;
  let invalidRows = 0;
  let skippedRows = 0;
  let duplicateRows = 0;

  const previewRows: ImportPreviewRow[] = [];

  rows.forEach((row, index) => {
    const record = mapRowToRecord(row, mapping, mode, template);
    const validation = validateImportRecord(mode, record);

    if (!validation.success) {
      invalidRows += 1;
      if (previewRows.length < PREVIEW_LIMIT) {
        previewRows.push({
          rowIndex: index + 1,
          status: "invalid",
          dedupeStatus: "unique",
          message: validation.error,
          record,
        });
      }
      return;
    }

    const dedupeKey = dedupeKeyForRecord(mode, record);
    let dedupeStatus: RowDedupeStatus = "unique";

    if (dedupeKey) {
      const normalizedKey = normalizeDedupeKey(dedupeKey);
      const duplicateInFile = seenInFile.has(normalizedKey);
      const duplicateExisting = existingKeySet.has(normalizedKey);

      if (duplicateInFile) {
        dedupeStatus = "duplicate_in_file";
      } else if (duplicateExisting) {
        dedupeStatus = "duplicate_existing";
      } else {
        seenInFile.add(normalizedKey);
      }

      const isDuplicate = dedupeStatus !== "unique";
      if (isDuplicate) {
        duplicateRows += 1;
        if (skipDuplicates) {
          skippedRows += 1;
          if (previewRows.length < PREVIEW_LIMIT) {
            previewRows.push({
              rowIndex: index + 1,
              status: "skipped",
              dedupeStatus,
              message:
                dedupeStatus === "duplicate_in_file"
                  ? "Duplicate within this file"
                  : "Already exists in DrainSheets",
              record,
            });
          }
          return;
        }

        warningRows += 1;
        validRows += 1;
        if (previewRows.length < PREVIEW_LIMIT) {
          previewRows.push({
            rowIndex: index + 1,
            status: "warning",
            dedupeStatus,
            message: "Duplicate — will import anyway",
            record,
          });
        }
        return;
      }
    }

    validRows += 1;
    if (previewRows.length < PREVIEW_LIMIT) {
      previewRows.push({
        rowIndex: index + 1,
        status: "valid",
        dedupeStatus,
        record,
      });
    }
  });

  return {
    totalRows: rows.length,
    validRows,
    warningRows,
    invalidRows,
    skippedRows,
    duplicateRows,
    rows: previewRows,
  };
}
