import type { Json } from "@/types/database";
import type { SheetColumn } from "@/types/domain";
import {
  normalizeSelectOptions,
  parseSelectOptionsFromConfig,
  resolveSelectColor,
} from "@/lib/sheets/select-options";
import { getColumnDecimals, getCurrencyCode } from "@/lib/sheets/column-config";

export type SelectOption = { value: string; label: string; color?: string };

export function getSelectOptions(column: SheetColumn): SelectOption[] {
  return normalizeSelectOptions(parseSelectOptionsFromConfig(column.config)).map((option) => ({
    value: option.value,
    label: option.label,
    color: resolveSelectColor(option.color),
  }));
}

export function isEmptyValue(value: Json | undefined): boolean {
  return value === null || value === undefined || value === "";
}

export function valueToString(value: Json | undefined): string {
  if (isEmptyValue(value)) {
    return "";
  }

  return String(value);
}

export function parseBooleanValue(value: Json | undefined): boolean {
  return value === true || value === "true";
}

export function formatDisplayValue(column: SheetColumn, value: Json | undefined): string {
  if (isEmptyValue(value)) {
    return "";
  }

  switch (column.type) {
    case "checkbox":
      return parseBooleanValue(value) ? "Yes" : "No";
    case "select": {
      const match = getSelectOptions(column).find((option) => option.value === String(value));
      return match?.label ?? String(value);
    }
    case "currency": {
      const numeric = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(numeric)) {
        return String(value);
      }
      const decimals = getColumnDecimals(column);
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: getCurrencyCode(column),
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(numeric);
    }
    case "number": {
      const numeric = typeof value === "number" ? value : Number(value);
      if (Number.isNaN(numeric)) {
        return String(value);
      }
      const decimals = getColumnDecimals(column);
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(numeric);
    }
    case "date":
      return String(value);
    case "url":
    case "email":
    case "phone":
    case "text":
    case "long_text":
    case "contact":
      return String(value);
    default:
      return String(value);
  }
}

export function parseNumericValue(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const numeric = Number(trimmed.replace(/,/g, ""));
  return Number.isNaN(numeric) ? null : numeric;
}
