import type { ColumnType, SheetColumn } from "@/types/domain";

export const DEFAULT_COLUMN_WIDTHS: Record<ColumnType, number> = {
  text: 200,
  long_text: 300,
  select: 160,
  checkbox: 80,
  date: 140,
  currency: 140,
  number: 120,
  url: 200,
  email: 200,
  phone: 140,
  contact: 200,
};

export const ROW_NUMBER_WIDTH = 48;

export function getDefaultColumnWidth(type: ColumnType): number {
  return DEFAULT_COLUMN_WIDTHS[type] ?? 200;
}

export function getColumnWidth(column: SheetColumn): number {
  if (column.width && column.width > 0) {
    return column.width;
  }

  return getDefaultColumnWidth(column.type);
}

export type ColumnLayout = SheetColumn & {
  widthPx: number;
  pinLeft?: number;
};

export function buildColumnLayout(columns: SheetColumn[]): ColumnLayout[] {
  let pinOffset = ROW_NUMBER_WIDTH;

  return columns.map((column) => {
    const widthPx = getColumnWidth(column);

    if (column.is_pinned) {
      const layout: ColumnLayout = { ...column, widthPx, pinLeft: pinOffset };
      pinOffset += widthPx;
      return layout;
    }

    return { ...column, widthPx };
  });
}
