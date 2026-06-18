import * as XLSX from "xlsx";

export type ImportRow = Record<string, string | number | null>;

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 5000;

const SUPPORTED_EXTENSIONS = [".csv", ".xlsx", ".xls"] as const;

export type ParseImportResult =
  | {
      success: true;
      columns: string[];
      rows: ImportRow[];
      sheetName: string;
    }
  | { success: false; error: string };

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

function isRowEmpty(row: ImportRow): boolean {
  return Object.values(row).every(
    (value) => value === null || value === undefined || String(value).trim() === "",
  );
}

function cellToValue(cell: unknown): string | number | null {
  if (cell === null || cell === undefined) {
    return null;
  }
  if (typeof cell === "number") {
    return cell;
  }
  if (typeof cell === "boolean") {
    return cell ? "true" : "false";
  }
  const text = String(cell).trim();
  return text.length > 0 ? text : null;
}

function normalizeHeader(header: unknown, index: number): string {
  if (header === null || header === undefined || String(header).trim() === "") {
    return `Column ${index + 1}`;
  }
  return String(header).trim();
}

export function validateImportFile(file: File): string | null {
  const ext = extensionOf(file.name);
  if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
    return "Unsupported file type. Upload a .csv, .xlsx, or .xls file.";
  }
  if (file.size > MAX_IMPORT_FILE_BYTES) {
    return `File is too large. Maximum size is ${Math.round(MAX_IMPORT_FILE_BYTES / (1024 * 1024))} MB.`;
  }
  if (file.size === 0) {
    return "The file is empty.";
  }
  return null;
}

export function parseImportBuffer(buffer: ArrayBuffer, filename: string): ParseImportResult {
  const ext = extensionOf(filename);
  if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
    return { success: false, error: "Unsupported file type. Upload a .csv, .xlsx, or .xls file." };
  }

  if (buffer.byteLength > MAX_IMPORT_FILE_BYTES) {
    return {
      success: false,
      error: `File is too large. Maximum size is ${Math.round(MAX_IMPORT_FILE_BYTES / (1024 * 1024))} MB.`,
    };
  }

  try {
    const workbook = XLSX.read(buffer, {
      type: "array",
      cellDates: false,
      raw: false,
    });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, error: "No worksheets found in the file." };
    }

    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      return { success: false, error: "Could not read the first worksheet." };
    }

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
    });

    if (matrix.length === 0) {
      return { success: false, error: "The worksheet is empty." };
    }

    const headerRow = matrix[0] ?? [];
    const columns = headerRow.map((cell, index) => normalizeHeader(cell, index));

    const rows: ImportRow[] = [];
    for (let rowIndex = 1; rowIndex < matrix.length; rowIndex += 1) {
      const raw = matrix[rowIndex] ?? [];
      const row: ImportRow = {};
      for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
        const column = columns[colIndex];
        if (!column) {
          continue;
        }
        row[column] = cellToValue(raw[colIndex]);
      }
      if (!isRowEmpty(row)) {
        rows.push(row);
      }
    }

    if (rows.length === 0) {
      return { success: false, error: "No data rows found after the header row." };
    }

    if (rows.length > MAX_IMPORT_ROWS) {
      return {
        success: false,
        error: `Too many rows (${rows.length}). Maximum is ${MAX_IMPORT_ROWS}.`,
      };
    }

    return { success: true, columns, rows, sheetName };
  } catch {
    return {
      success: false,
      error: "Could not parse the file. Ensure it is a valid CSV or Excel export.",
    };
  }
}

export async function parseImportFile(file: File): Promise<ParseImportResult> {
  const validationError = validateImportFile(file);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const buffer = await file.arrayBuffer();
  return parseImportBuffer(buffer, file.name);
}
