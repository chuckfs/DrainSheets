import { describe, expect, it } from "vitest";
import {
  BLANK_SHEET_COLUMNS,
  BLANK_SHEET_PRIMARY_KEY,
  BLANK_SHEET_SEED_ROWS,
} from "@/lib/sheets/blank-sheet";

describe("blank-sheet", () => {
  it("seeds a single placeholder column and one empty row", () => {
    expect(BLANK_SHEET_COLUMNS).toHaveLength(1);
    expect(BLANK_SHEET_COLUMNS[0]?.key).toBe(BLANK_SHEET_PRIMARY_KEY);
    expect(BLANK_SHEET_COLUMNS[0]?.label).toBe("Column");
    expect(BLANK_SHEET_SEED_ROWS).toEqual([{ column: null }]);
  });
});
