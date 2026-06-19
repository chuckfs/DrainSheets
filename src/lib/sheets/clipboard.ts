import type { Json } from "@/types/database";

export function cellValueToTsv(value: Json | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value).replace(/\t/g, " ").replace(/\r?\n/g, " ");
}

export function serializeRangeToTsv(
  getValue: (rowIndex: number, colIndex: number) => Json | undefined,
  minRow: number,
  maxRow: number,
  minCol: number,
  maxCol: number,
): string {
  const lines: string[] = [];

  for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex += 1) {
    const cells: string[] = [];
    for (let colIndex = minCol; colIndex <= maxCol; colIndex += 1) {
      cells.push(cellValueToTsv(getValue(rowIndex, colIndex)));
    }
    lines.push(cells.join("\t"));
  }

  return lines.join("\n");
}

export function parseTsv(text: string): string[][] {
  const trimmed = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!trimmed) {
    return [];
  }

  return trimmed.split("\n").map((line) => line.split("\t"));
}

export function parseClipboardValue(raw: string): Json | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed === "TRUE") {
    return true;
  }

  if (trimmed === "FALSE") {
    return false;
  }

  const numeric = Number(trimmed);
  if (!Number.isNaN(numeric) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return numeric;
  }

  return raw;
}
