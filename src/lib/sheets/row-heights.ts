import type { Row } from "@/types/domain";

export const DEFAULT_ROW_HEIGHT = 32;
export const MIN_ROW_HEIGHT = 24;
export const MAX_ROW_HEIGHT = 400;

export function clampRowHeight(height: number): number {
  return Math.min(MAX_ROW_HEIGHT, Math.max(MIN_ROW_HEIGHT, Math.round(height)));
}

export function getRowHeight(row: Row | null | undefined): number {
  if (!row || row.height === null || row.height === undefined) {
    return DEFAULT_ROW_HEIGHT;
  }

  return clampRowHeight(row.height);
}

export function normalizeRowHeightForStorage(height: number): number | null {
  const clamped = clampRowHeight(height);
  return clamped === DEFAULT_ROW_HEIGHT ? null : clamped;
}
