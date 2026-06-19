import * as XLSX from "xlsx";
import type { ImportRow, ParseImportResult } from "./types";

function normalizeCellValue(value: unknown): ImportRow[string] {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function isEmptyRow(row: ImportRow, columns: string[]): boolean {
  return columns.every((column) => {
    const value = row[column];
    return value === null || value === undefined || value === "";
  });
}

function rowsFromMatrix(matrix: unknown[][]): { columns: string[]; rows: ImportRow[] } {
  if (matrix.length === 0) {
    return { columns: [], rows: [] };
  }

  const headerRow = matrix[0] ?? [];
  const columns = headerRow.map((cell, index) => {
    const label = normalizeCellValue(cell);
    return label ? String(label) : `Column ${index + 1}`;
  });

  const rows: ImportRow[] = [];

  for (const rawRow of matrix.slice(1)) {
    const row: ImportRow = {};
    for (let index = 0; index < columns.length; index += 1) {
      const column = columns[index];
      if (!column) {
        continue;
      }
      row[column] = normalizeCellValue(rawRow[index]);
    }

    if (!isEmptyRow(row, columns)) {
      rows.push(row);
    }
  }

  return { columns, rows };
}

export function parseImportBuffer(buffer: ArrayBuffer, fileName: string): ParseImportResult {
  const lowerName = fileName.toLowerCase();

  try {
    if (lowerName.endsWith(".csv")) {
      const text = new TextDecoder().decode(buffer);
      const matrix = text
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)
        .map((line) => {
          const cells: string[] = [];
          let current = "";
          let inQuotes = false;

          for (let index = 0; index < line.length; index += 1) {
            const char = line[index];
            const next = line[index + 1];

            if (char === '"') {
              if (inQuotes && next === '"') {
                current += '"';
                index += 1;
              } else {
                inQuotes = !inQuotes;
              }
              continue;
            }

            if (char === "," && !inQuotes) {
              cells.push(current);
              current = "";
              continue;
            }

            current += char;
          }

          cells.push(current);
          return cells;
        });

      const { columns, rows } = rowsFromMatrix(matrix);
      return { success: true, data: { fileName, columns, rows } };
    }

    if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        return { success: false, error: "Workbook has no sheets" };
      }

      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        return { success: false, error: "Worksheet is empty" };
      }

      const matrix = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        raw: false,
        defval: "",
      }) as unknown[][];

      const { columns, rows } = rowsFromMatrix(matrix);
      return { success: true, data: { fileName, columns, rows } };
    }

    return { success: false, error: "Unsupported file type. Upload CSV or XLSX." };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse import file",
    };
  }
}
