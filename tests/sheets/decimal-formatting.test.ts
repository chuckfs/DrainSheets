import { describe, expect, it } from "vitest";
import type { SheetColumn } from "@/types/domain";
import { getColumnDecimals } from "@/lib/sheets/column-config";
import { formatDisplayValue } from "@/components/sheets/cell-renderers/utils";

const currencyColumn: SheetColumn = {
  id: "col-1",
  sheet_id: "sheet-1",
  org_id: "org-1",
  key: "rent",
  label: "Rent",
  type: "currency",
  position: 0,
  width: 120,
  is_primary: true,
  is_pinned: false,
  is_hidden: false,
  config: { currency: "USD", decimals: 3 },
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("decimal formatting", () => {
  it("uses configured decimal places for currency columns", () => {
    const formatted = formatDisplayValue(currencyColumn, 12.5);
    expect(formatted).toContain("12.500");
    expect(getColumnDecimals(currencyColumn)).toBe(3);
  });
});
