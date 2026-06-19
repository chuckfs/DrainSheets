import { labelToKey } from "@/lib/sheets/column-key";
import type { Json } from "@/types/database";

export type SelectOptionConfig = {
  label: string;
  value?: string;
  color?: string;
};

export type NormalizedSelectOption = {
  label: string;
  value: string;
  color?: string;
};

const NAMED_COLORS: Record<string, string> = {
  gray: "#6b7280",
  blue: "#3b82f6",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#eab308",
  purple: "#8b5cf6",
  orange: "#f97316",
  pink: "#ec4899",
  teal: "#14b8a6",
};

export function resolveSelectColor(color?: string): string | undefined {
  if (!color) {
    return undefined;
  }

  const normalized = color.trim().toLowerCase();
  if (normalized.startsWith("#")) {
    return color;
  }

  return NAMED_COLORS[normalized] ?? color;
}

export function parseSelectOptionsFromConfig(config: Json | undefined): SelectOptionConfig[] {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return [];
  }

  const options = (config as { options?: unknown }).options;
  if (!Array.isArray(options)) {
    return [];
  }

  return options
    .filter((option): option is Record<string, unknown> => typeof option === "object" && option !== null)
    .map((option) => ({
      label: typeof option.label === "string" ? option.label : "",
      value: typeof option.value === "string" ? option.value : undefined,
      color: typeof option.color === "string" ? option.color : undefined,
    }))
    .filter((option) => option.label.length > 0);
}

export function normalizeSelectOptions(options: SelectOptionConfig[]): NormalizedSelectOption[] {
  const usedValues = new Set<string>();

  return options.map((option) => {
    let value = option.value?.trim() || labelToKey(option.label);
    if (!value) {
      value = "option";
    }

    let uniqueValue = value;
    let suffix = 2;
    while (usedValues.has(uniqueValue)) {
      uniqueValue = `${value}_${suffix}`;
      suffix += 1;
    }
    usedValues.add(uniqueValue);

    return {
      label: option.label.trim(),
      value: uniqueValue,
      color: option.color,
    };
  });
}

export function selectOptionsToConfig(options: SelectOptionConfig[]): Json {
  return {
    options: normalizeSelectOptions(options).map((option) => ({
      label: option.label,
      value: option.value,
      color: option.color ?? null,
    })),
  };
}
