import type { Json } from "@/types/database";
import type { Row } from "@/types/domain";

export type CellAlign = "left" | "center" | "right";

export type CellStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: CellAlign;
  color?: string;
  backgroundColor?: string;
};

export type RowStylesMap = Record<string, CellStyle>;

export type FillColorPresetId = "yellow" | "blue" | "green" | "gray";

const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const FILL_PRESET_PREFIX = "preset:";

export const TEXT_COLOR_PRESETS = [
  { label: "Default", value: null },
  { label: "Black", value: "#111827" },
  { label: "Red", value: "#dc2626" },
  { label: "Blue", value: "#2563eb" },
  { label: "Green", value: "#16a34a" },
] as const;

export const FILL_COLOR_PRESETS: Array<{
  label: string;
  id: FillColorPresetId | null;
  light: string | null;
  dark: string | null;
}> = [
  { label: "None", id: null, light: null, dark: null },
  { label: "Yellow", id: "yellow", light: "#fef9c3", dark: "#422006" },
  { label: "Blue", id: "blue", light: "#dbeafe", dark: "#1e3a5f" },
  { label: "Green", id: "green", light: "#dcfce7", dark: "#14532d" },
  { label: "Gray", id: "gray", light: "#f3f4f6", dark: "#374151" },
];

const LEGACY_FILL_HEX_TO_PRESET: Record<string, FillColorPresetId> = {
  "#fef9c3": "yellow",
  "#dbeafe": "blue",
  "#dcfce7": "green",
  "#f3f4f6": "gray",
};

export function fillPresetStorageValue(id: FillColorPresetId): string {
  return `${FILL_PRESET_PREFIX}${id}`;
}

export function isFillPresetValue(value: string): boolean {
  return value.startsWith(FILL_PRESET_PREFIX);
}

export function parseFillPresetId(value: string | undefined): FillColorPresetId | null {
  if (!value) {
    return null;
  }

  if (isFillPresetValue(value)) {
    const id = value.slice(FILL_PRESET_PREFIX.length) as FillColorPresetId;
    return FILL_COLOR_PRESETS.some((preset) => preset.id === id) ? id : null;
  }

  return LEGACY_FILL_HEX_TO_PRESET[value.toLowerCase()] ?? null;
}

export function resolveFillColor(value: string | undefined, isDark: boolean): string | undefined {
  if (!value) {
    return undefined;
  }

  const presetId = parseFillPresetId(value);
  if (presetId) {
    const preset = FILL_COLOR_PRESETS.find((entry) => entry.id === presetId);
    if (!preset) {
      return undefined;
    }

    return isDark ? preset.dark ?? undefined : preset.light ?? undefined;
  }

  if (HEX_COLOR.test(value)) {
    return value;
  }

  return undefined;
}

export function parseRowStyles(styles: Json | undefined): RowStylesMap {
  if (!styles || typeof styles !== "object" || Array.isArray(styles)) {
    return {};
  }

  const parsed: RowStylesMap = {};
  for (const [key, value] of Object.entries(styles)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      parsed[key] = normalizeCellStyle(value as Record<string, unknown>);
    }
  }

  return parsed;
}

export function normalizeCellStyle(raw: Record<string, unknown>): CellStyle {
  const style: CellStyle = {};

  if (raw.bold === true) style.bold = true;
  if (raw.italic === true) style.italic = true;
  if (raw.underline === true) style.underline = true;

  if (raw.align === "left" || raw.align === "center" || raw.align === "right") {
    style.align = raw.align;
  }

  if (typeof raw.color === "string" && HEX_COLOR.test(raw.color)) {
    style.color = raw.color;
  }

  if (typeof raw.backgroundColor === "string") {
    if (isFillPresetValue(raw.backgroundColor) || HEX_COLOR.test(raw.backgroundColor)) {
      style.backgroundColor = raw.backgroundColor;
    }
  }

  return style;
}

export function isEmptyCellStyle(style: CellStyle | null | undefined): boolean {
  if (!style) {
    return true;
  }

  return (
    !style.bold &&
    !style.italic &&
    !style.underline &&
    !style.align &&
    !style.color &&
    !style.backgroundColor
  );
}

export function mergeCellStyle(base: CellStyle | undefined, patch: Partial<CellStyle>): CellStyle {
  const next: CellStyle = { ...base };

  if ("bold" in patch) next.bold = patch.bold || undefined;
  if ("italic" in patch) next.italic = patch.italic || undefined;
  if ("underline" in patch) next.underline = patch.underline || undefined;
  if ("align" in patch) next.align = patch.align || undefined;
  if ("color" in patch) next.color = patch.color || undefined;
  if ("backgroundColor" in patch) next.backgroundColor = patch.backgroundColor || undefined;

  if (!next.bold) delete next.bold;
  if (!next.italic) delete next.italic;
  if (!next.underline) delete next.underline;
  if (!next.align) delete next.align;
  if (!next.color) delete next.color;
  if (!next.backgroundColor) delete next.backgroundColor;

  return next;
}

export function getCellStyleFromRow(row: Row | null | undefined, columnKey: string): CellStyle {
  if (!row) {
    return {};
  }

  return parseRowStyles(row.styles)[columnKey] ?? {};
}

export function rowStylesToJson(styles: RowStylesMap): Json {
  return styles as Json;
}

export function cellStyleClassName(style: CellStyle | undefined): string {
  const classes: string[] = [];
  if (style?.bold) classes.push("font-semibold");
  if (style?.italic) classes.push("italic");
  if (style?.underline) classes.push("underline");
  if (style?.align === "center") classes.push("text-center");
  if (style?.align === "right") classes.push("text-right");
  return classes.join(" ");
}

export function cellStyleInline(
  style: CellStyle | undefined,
  options?: { isDark?: boolean },
): Record<string, string> {
  const inline: Record<string, string> = {};
  if (style?.color) inline.color = style.color;
  if (style?.backgroundColor) {
    inline.backgroundColor =
      resolveFillColor(style.backgroundColor, options?.isDark ?? false) ?? style.backgroundColor;
  }
  if (style?.align === "left") inline.textAlign = "left";
  if (style?.align === "center") inline.textAlign = "center";
  if (style?.align === "right") inline.textAlign = "right";
  return inline;
}

export function setCellStyleOnRow(row: Row, columnKey: string, style: CellStyle | null): Row {
  const styles = parseRowStyles(row.styles);
  if (!style || isEmptyCellStyle(style)) {
    delete styles[columnKey];
  } else {
    styles[columnKey] = style;
  }

  return {
    ...row,
    styles: rowStylesToJson(styles),
  };
}

export function styleToHistoryJson(style: CellStyle | null): Json | null {
  if (!style || isEmptyCellStyle(style)) {
    return null;
  }

  return style as Json;
}
