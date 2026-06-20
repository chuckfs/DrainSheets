import type { Json } from "@/types/database";
import type { ColumnType, SheetColumn } from "@/types/domain";

const MIN_DECIMALS = 0;
const MAX_DECIMALS = 6;

export function parseColumnConfig(config: Json): Record<string, unknown> {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }

  return config as Record<string, unknown>;
}

export function clampDecimals(value: number): number {
  return Math.min(MAX_DECIMALS, Math.max(MIN_DECIMALS, Math.round(value)));
}

export function getColumnDecimals(column: SheetColumn): number {
  const config = parseColumnConfig(column.config);
  const decimals = config.decimals;
  if (typeof decimals === "number" && Number.isFinite(decimals)) {
    return clampDecimals(decimals);
  }

  return column.type === "currency" ? 2 : 0;
}

export function getCurrencyCode(column: SheetColumn): string {
  const config = parseColumnConfig(column.config);
  const currency = config.currency;
  return typeof currency === "string" && currency.length > 0 ? currency : "USD";
}

export function buildNumericConfig(column: SheetColumn, decimals: number): Json {
  const config = parseColumnConfig(column.config);
  return {
    ...config,
    decimals: clampDecimals(decimals),
  } as Json;
}

export function defaultConfigForType(type: ColumnType): Json {
  switch (type) {
    case "select":
      return { options: [] } as Json;
    case "currency":
      return { currency: "USD", decimals: 2 } as Json;
    case "number":
      return { decimals: 0 } as Json;
    default:
      return {} as Json;
  }
}
