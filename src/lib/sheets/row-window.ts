import type { Row } from "@/types/domain";

export const ROW_WINDOW_SIZE = 200;
export const ROW_LOAD_OVERSCAN = 40;

export type RowLoadRange = {
  offset: number;
  limit: number;
};

export function computeLoadRange(
  visibleStart: number,
  visibleEnd: number,
  totalCount: number,
): RowLoadRange | null {
  if (totalCount <= 0) {
    return null;
  }

  const start = Math.max(0, visibleStart - ROW_LOAD_OVERSCAN);
  const end = Math.min(totalCount - 1, visibleEnd + ROW_LOAD_OVERSCAN);
  const windowStart = Math.floor(start / ROW_WINDOW_SIZE) * ROW_WINDOW_SIZE;
  const windowEnd = Math.min(
    totalCount - 1,
    Math.floor(end / ROW_WINDOW_SIZE) * ROW_WINDOW_SIZE + ROW_WINDOW_SIZE - 1,
  );

  return {
    offset: windowStart,
    limit: windowEnd - windowStart + 1,
  };
}

export function createSparseRowStore(totalCount: number, initialRows: Row[]): (Row | null)[] {
  const store = Array.from({ length: totalCount }, () => null as Row | null);
  for (let index = 0; index < initialRows.length && index < store.length; index += 1) {
    store[index] = initialRows[index] ?? null;
  }
  return store;
}

export function mergeRowsIntoStore(
  store: (Row | null)[],
  rows: Row[],
  offset: number,
): (Row | null)[] {
  const next = [...store];
  for (let index = 0; index < rows.length; index += 1) {
    const targetIndex = offset + index;
    if (targetIndex >= 0 && targetIndex < next.length) {
      next[targetIndex] = rows[index] ?? null;
    }
  }
  return next;
}

export function isRangeLoaded(store: (Row | null)[], start: number, end: number): boolean {
  if (start > end) {
    return true;
  }

  for (let index = start; index <= end; index += 1) {
    if (index < 0 || index >= store.length || store[index] === null) {
      return false;
    }
  }

  return true;
}

export function invalidateStoreRange(
  store: (Row | null)[],
  start: number,
  end: number,
): (Row | null)[] {
  const next = [...store];
  for (let index = Math.max(0, start); index <= Math.min(end, next.length - 1); index += 1) {
    next[index] = null;
  }
  return next;
}

export function getLoadedRows(store: (Row | null)[]): Row[] {
  return store.filter((row): row is Row => row !== null);
}

export function spliceSparseRow(store: (Row | null)[], index: number): (Row | null)[] {
  const next = [...store];
  next.splice(index, 1);
  return next;
}

export function insertSparseRow(store: (Row | null)[], index: number, row: Row): (Row | null)[] {
  const next = [...store];
  next.splice(index, 0, row);
  return next;
}

export function appendSparseRow(store: (Row | null)[], row: Row): (Row | null)[] {
  return [...store, row];
}

export function moveSparseRow(
  store: (Row | null)[],
  fromIndex: number,
  toIndex: number,
): (Row | null)[] {
  const next = [...store];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return store;
  }
  next.splice(toIndex, 0, moved);
  return next;
}
