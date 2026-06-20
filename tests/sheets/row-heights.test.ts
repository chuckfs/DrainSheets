import { describe, expect, it } from "vitest";
import {
  clampRowHeight,
  DEFAULT_ROW_HEIGHT,
  getRowHeight,
  normalizeRowHeightForStorage,
} from "@/lib/sheets/row-heights";
import type { Row } from "@/types/domain";

const baseRow: Row = {
  id: "row-1",
  sheet_id: "sheet-1",
  org_id: "org-1",
  position: 0,
  data: {},
  is_hidden: false,
  height: null,
  styles: {},
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  created_by: null,
  search_vector: null,
};

describe("row-heights", () => {
  it("returns default height when row height is null", () => {
    expect(getRowHeight(baseRow)).toBe(DEFAULT_ROW_HEIGHT);
  });

  it("clamps heights to supported range", () => {
    expect(clampRowHeight(10)).toBe(24);
    expect(clampRowHeight(999)).toBe(400);
  });

  it("stores null when height matches default", () => {
    expect(normalizeRowHeightForStorage(DEFAULT_ROW_HEIGHT)).toBeNull();
    expect(normalizeRowHeightForStorage(48)).toBe(48);
  });
});
