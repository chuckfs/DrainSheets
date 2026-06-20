import { describe, expect, it } from "vitest";
import type { Row, SheetColumn } from "@/types/domain";
import { previewColumnTypeCoercion } from "@/lib/sheets/coerce-column-type";

const column: SheetColumn = {
  id: "col-1",
  sheet_id: "sheet-1",
  org_id: "org-1",
  key: "amount",
  label: "Amount",
  type: "text",
  position: 0,
  width: 120,
  is_primary: true,
  is_pinned: false,
  is_hidden: false,
  config: {},
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

const rows: Row[] = [
  {
    id: "row-1",
    sheet_id: "sheet-1",
    org_id: "org-1",
    position: 0,
    data: { amount: "42" },
    is_hidden: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    search_vector: null,
  },
  {
    id: "row-2",
    sheet_id: "sheet-1",
    org_id: "org-1",
    position: 1,
    data: { amount: "hello" },
    is_hidden: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    search_vector: null,
  },
];

describe("previewColumnTypeCoercion", () => {
  it("counts numeric conversions when changing text to number", () => {
    const preview = previewColumnTypeCoercion(rows, column, "number");
    expect(preview.totalCells).toBe(2);
    expect(preview.changedCells).toBe(2);
  });
});
