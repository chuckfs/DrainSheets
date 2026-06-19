export type CellCoord = { rowIndex: number; colIndex: number };

export type CellRange = {
  start: CellCoord;
  end: CellCoord;
};

export type NormalizedRange = {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
};

export function normalizeRange(range: CellRange): NormalizedRange {
  return {
    minRow: Math.min(range.start.rowIndex, range.end.rowIndex),
    maxRow: Math.max(range.start.rowIndex, range.end.rowIndex),
    minCol: Math.min(range.start.colIndex, range.end.colIndex),
    maxCol: Math.max(range.start.colIndex, range.end.colIndex),
  };
}

export function isCellInRange(rowIndex: number, colIndex: number, range: CellRange | null): boolean {
  if (!range) {
    return false;
  }

  const { minRow, maxRow, minCol, maxCol } = normalizeRange(range);
  return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
}

export function isSameCell(a: CellCoord | null, b: CellCoord | null): boolean {
  if (!a || !b) {
    return false;
  }

  return a.rowIndex === b.rowIndex && a.colIndex === b.colIndex;
}

export function getSelectedRowIndexes(range: CellRange | null): number[] {
  if (!range) {
    return [];
  }

  const { minRow, maxRow } = normalizeRange(range);
  const indexes: number[] = [];
  for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex += 1) {
    indexes.push(rowIndex);
  }
  return indexes;
}

export function rangeSpansMultipleRows(range: CellRange | null): boolean {
  if (!range) {
    return false;
  }

  const { minRow, maxRow } = normalizeRange(range);
  return maxRow > minRow;
}

export function rangeSpansMultipleCells(range: CellRange | null): boolean {
  if (!range) {
    return false;
  }

  const { minRow, maxRow, minCol, maxCol } = normalizeRange(range);
  return maxRow > minRow || maxCol > minCol;
}
