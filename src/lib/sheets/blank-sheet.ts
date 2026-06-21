import type { Json } from "@/types/database";
import { getDefaultColumnWidth } from "@/lib/sheets/column-widths";
import type { TemplateColumnDefinition } from "@/lib/validations/template";

export const BLANK_SHEET_PRIMARY_KEY = "column";

export const BLANK_SHEET_COLUMNS: TemplateColumnDefinition[] = [
  {
    key: BLANK_SHEET_PRIMARY_KEY,
    label: "Column",
    type: "text",
    position: 0,
    is_primary: true,
    is_pinned: false,
    width: getDefaultColumnWidth("text"),
    config: {},
  },
];

export const BLANK_SHEET_SEED_ROWS: Array<Record<string, Json | undefined>> = [
  { [BLANK_SHEET_PRIMARY_KEY]: null },
];
