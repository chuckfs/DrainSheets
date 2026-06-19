import { describe, expect, it } from "vitest";
import {
  buildSingleCellHistoryEntry,
  extractRowData,
  insertRowAtIndex,
  resolveColumnRenameLabel,
} from "@/lib/sheets/grid-history";
import type { Row } from "@/types/domain";

const sampleRow: Row = {
  id: "row-1",
  sheet_id: "sheet-1",
  org_id: "org-1",
  position: 0,
  data: { company: "Acme", amount: 10 },
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  created_by: null,
  search_vector: null,
};

describe("grid history helpers", () => {
  it("extracts row JSON data", () => {
    expect(extractRowData(sampleRow)).toEqual({ company: "Acme", amount: 10 });
    expect(extractRowData({ ...sampleRow, data: null })).toEqual({});
  });

  it("builds single-cell history using pre-update value", () => {
    const entry = buildSingleCellHistoryEntry(
      { rowIndex: 0, colIndex: 0, value: "Beta" },
      [{ id: "row-1" }],
      [{ key: "company" }],
      "Acme",
    );

    expect(entry).toEqual({
      type: "cell",
      rowId: "row-1",
      columnKey: "company",
      before: "Acme",
      after: "Beta",
    });
  });

  it("skips history for temp rows", () => {
    const entry = buildSingleCellHistoryEntry(
      { rowIndex: 0, colIndex: 0, value: "Beta" },
      [{ id: "temp-123" }],
      [{ key: "company" }],
      "Acme",
    );

    expect(entry).toBeNull();
  });

  it("resolves column rename labels for undo and redo", () => {
    const entry = {
      type: "column_rename" as const,
      columnId: "col-1",
      before: "Company",
      after: "Tenant",
    };

    expect(resolveColumnRenameLabel(entry, "undo")).toBe("Company");
    expect(resolveColumnRenameLabel(entry, "redo")).toBe("Tenant");
  });

  it("restores deleted rows at the original index", () => {
    const restored = { ...sampleRow, id: "row-restored" };
    const rows = [{ ...sampleRow, id: "row-a" }, { ...sampleRow, id: "row-b" }];

    expect(insertRowAtIndex(rows, restored, 1)).toEqual([
      rows[0],
      restored,
      rows[1],
    ]);
  });
});
