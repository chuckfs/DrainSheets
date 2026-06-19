import type { ColumnType } from "@/types/domain";
import type { Json } from "@/types/database";
import type { ColumnMappingEntry, ImportCellValue, ImportRow } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function extractEmail(value: ImportCellValue): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const text = String(value).trim();
  if (EMAIL_RE.test(text)) {
    return text.toLowerCase();
  }

  const bracketMatch = text.match(/<([^>]+@[^>]+)>/);
  if (bracketMatch?.[1] && EMAIL_RE.test(bracketMatch[1])) {
    return bracketMatch[1].toLowerCase();
  }

  return null;
}

export function coerceCellValue(value: ImportCellValue, type: ColumnType): Json | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  switch (type) {
    case "checkbox": {
      const normalized = String(value).trim().toLowerCase();
      if (["true", "yes", "y", "1", "checked", "x"].includes(normalized)) {
        return true;
      }
      if (["false", "no", "n", "0", "unchecked", ""].includes(normalized)) {
        return false;
      }
      return Boolean(value);
    }
    case "number":
    case "currency": {
      const numeric = Number(String(value).replace(/[$,€£¥\s]/g, ""));
      return Number.isFinite(numeric) ? numeric : undefined;
    }
    case "date": {
      const parsed = new Date(String(value));
      if (Number.isNaN(parsed.getTime())) {
        return String(value);
      }
      return parsed.toISOString().slice(0, 10);
    }
    case "url": {
      const text = String(value).trim();
      if (/^https?:\/\//i.test(text)) {
        return text;
      }
      if (/^www\./i.test(text) || /^[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) {
        return `https://${text.replace(/^\/\//, "")}`;
      }
      return text;
    }
    case "email":
      return extractEmail(value) ?? String(value).trim();
    case "phone":
      return String(value).trim();
    case "contact":
      return String(value).trim();
    case "select":
    case "text":
    case "long_text":
    default:
      return String(value);
  }
}

export function mapRowToSheetData(
  row: ImportRow,
  mapping: Record<string, ColumnMappingEntry>,
  columnTypes: Record<string, ColumnType>,
): Record<string, Json | undefined> {
  const data: Record<string, Json | undefined> = {};

  for (const entry of Object.values(mapping)) {
    if (!entry.targetKey) {
      continue;
    }

    const type = entry.typeOverride ?? columnTypes[entry.targetKey] ?? "text";
    data[entry.targetKey] = coerceCellValue(row[entry.sourceHeader], type);
  }

  return data;
}

export function isRowEmpty(data: Record<string, Json | undefined>): boolean {
  return Object.values(data).every((value) => value === undefined || value === null || value === "");
}

export function findContactEmailInRow(
  row: ImportRow,
  mapping: Record<string, ColumnMappingEntry>,
  columnTypes: Record<string, ColumnType>,
): string | null {
  for (const entry of Object.values(mapping)) {
    if (!entry.targetKey) {
      continue;
    }

    const type = entry.typeOverride ?? columnTypes[entry.targetKey] ?? "text";
    if (type === "email") {
      const email = extractEmail(row[entry.sourceHeader]);
      if (email) {
        return email;
      }
    }

    if (type === "contact") {
      const email = extractEmail(row[entry.sourceHeader]);
      if (email) {
        return email;
      }
    }
  }

  return null;
}

export function contactNameFromValue(value: ImportCellValue, fallbackEmail: string): {
  firstName: string;
  lastName: string | null;
} {
  if (value === null || value === undefined || value === "") {
    const local = fallbackEmail.split("@")[0] ?? "Contact";
    return { firstName: local, lastName: null };
  }

  const text = String(value).trim();
  const email = extractEmail(text);
  if (email) {
    const local = email.split("@")[0] ?? "Contact";
    return { firstName: local, lastName: null };
  }

  const parts = text.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0] ?? "Contact", lastName: null };
  }

  return {
    firstName: parts[0] ?? "Contact",
    lastName: parts.slice(1).join(" ") || null,
  };
}
