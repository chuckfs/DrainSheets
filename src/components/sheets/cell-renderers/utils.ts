import type { Json } from "@/types/database";
import type { SheetColumn } from "@/types/domain";

export type SelectOption = { value: string; label: string; color?: string };

export function getSelectOptions(column: SheetColumn): SelectOption[] {
  const config = column.config;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return [];
  }

  const options = (config as { options?: unknown }).options;
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .filter((option): option is { value: string; label?: string; color?: string } => {
      return (
        typeof option === "object" &&
        option !== null &&
        "value" in option &&
        typeof option.value === "string"
      );
    })
    .map((option) => ({
      value: option.value,
      label: typeof option.label === "string" ? option.label : option.value,
      color: typeof option.color === "string" ? option.color : undefined,
    }));
}

export function getCurrencyCode(column: SheetColumn): string {
  const config = column.config;
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return "USD";
  }

  const currency = (config as { currency?: unknown }).currency;
  return typeof currency === "string" && currency.length > 0 ? currency : "USD";
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
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: getCurrencyCode(column),
        maximumFractionDigits: 2,
      }).format(numeric);
    }
    case "number": {
      const numeric = typeof value === "number" ? value : Number(value);
      return Number.isNaN(numeric) ? String(value) : String(numeric);
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
