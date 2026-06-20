import { formatDisplayValue } from "@/components/sheets/cell-renderers/utils";
import type { Json } from "@/types/database";
import type { Row, SheetColumn } from "@/types/domain";
import * as XLSX from "xlsx";

function extractRowData(row: Row): Record<string, Json | undefined> {
  if (!row.data || typeof row.data !== "object" || Array.isArray(row.data)) {
    return {};
  }

  return row.data as Record<string, Json | undefined>;
}

export function filterExportColumns(
  columns: SheetColumn[],
  includeHidden: boolean,
): SheetColumn[] {
  return columns.filter((column) => includeHidden || !column.is_hidden);
}

export function filterExportRows(rows: Row[], includeHidden: boolean): Row[] {
  return rows.filter((row) => includeHidden || !row.is_hidden);
}

export function buildSheetExportMatrix(
  columns: SheetColumn[],
  rows: Row[],
): string[][] {
  const header = columns.map((column) => column.label);
  const body = rows.map((row) => {
    const data = extractRowData(row);
    return columns.map((column) => formatDisplayValue(column, data[column.key]));
  });

  return [header, ...body];
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function buildCsvContent(matrix: string[][]): string {
  const lines = matrix.map((row) => row.map((cell) => escapeCsvCell(cell)).join(","));
  return `\uFEFF${lines.join("\r\n")}`;
}

export function buildXlsxBase64(matrix: string[][]): string {
  const worksheet = XLSX.utils.aoa_to_sheet(matrix);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" }) as Buffer;
  return buffer.toString("base64");
}

export function buildCsvBase64(matrix: string[][]): string {
  const csv = buildCsvContent(matrix);
  return Buffer.from(csv, "utf-8").toString("base64");
}
