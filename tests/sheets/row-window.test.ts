import { describe, expect, it } from "vitest";
import type { Row } from "@/types/domain";
import {
  appendSparseRow,
  computeLoadRange,
  createSparseRowStore,
  insertSparseRow,
  invalidateStoreRange,
  isRangeLoaded,
  mergeRowsIntoStore,
  moveSparseRow,
  spliceSparseRow,
} from "@/lib/sheets/row-window";

function makeRow(id: string, position: number): Row {
  return {
    id,
    sheet_id: "sheet-1",
    org_id: "org-1",
    position,
    data: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    search_vector: null,
  };
}

describe("computeLoadRange", () => {
  it("returns null for empty sheets", () => {
    expect(computeLoadRange(0, 10, 0)).toBeNull();
  });

  it("aligns to window boundaries with overscan", () => {
    const range = computeLoadRange(250, 270, 500);
    expect(range).toEqual({ offset: 200, limit: 200 });
  });

  it("clamps to sheet bounds", () => {
    expect(computeLoadRange(0, 5, 50)).toEqual({ offset: 0, limit: 50 });
    expect(computeLoadRange(480, 499, 500)).toEqual({ offset: 400, limit: 100 });
  });
});

describe("sparse row store", () => {
  it("creates a fixed-length store with initial rows at the front", () => {
    const store = createSparseRowStore(5, [makeRow("a", 0), makeRow("b", 1)]);
    expect(store).toHaveLength(5);
    expect(store[0]?.id).toBe("a");
    expect(store[1]?.id).toBe("b");
    expect(store[2]).toBeNull();
  });

  it("merges fetched rows at an offset", () => {
    const store = createSparseRowStore(4, []);
    const merged = mergeRowsIntoStore(store, [makeRow("c", 2), makeRow("d", 3)], 2);
    expect(merged[2]?.id).toBe("c");
    expect(merged[3]?.id).toBe("d");
    expect(merged[0]).toBeNull();
  });

  it("tracks loaded ranges", () => {
    const store = createSparseRowStore(4, [makeRow("a", 0)]);
    expect(isRangeLoaded(store, 0, 0)).toBe(true);
    expect(isRangeLoaded(store, 0, 1)).toBe(false);
  });

  it("invalidates a range", () => {
    const store = createSparseRowStore(3, [makeRow("a", 0), makeRow("b", 1), makeRow("c", 2)]);
    const next = invalidateStoreRange(store, 1, 2);
    expect(next[0]?.id).toBe("a");
    expect(next[1]).toBeNull();
    expect(next[2]).toBeNull();
  });
});

describe("sparse row mutations", () => {
  it("splices, inserts, appends, and moves rows", () => {
    const base = createSparseRowStore(3, [makeRow("a", 0), makeRow("b", 1), makeRow("c", 2)]);

    const removed = spliceSparseRow(base, 1);
    expect(removed).toHaveLength(2);
    expect(removed.map((row) => row?.id)).toEqual(["a", "c"]);

    const inserted = insertSparseRow(removed, 1, makeRow("b", 1));
    expect(inserted.map((row) => row?.id)).toEqual(["a", "b", "c"]);

    const appended = appendSparseRow(inserted, makeRow("d", 3));
    expect(appended).toHaveLength(4);
    expect(appended[3]?.id).toBe("d");

    const moved = moveSparseRow(appended, 3, 1);
    expect(moved.map((row) => row?.id)).toEqual(["a", "d", "b", "c"]);
  });
});
