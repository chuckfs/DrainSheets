import { describe, expect, it } from "vitest";
import type { Row, SheetColumn } from "@/types/domain";
import {
  buildCsvContent,
  buildSheetExportMatrix,
  filterExportColumns,
  filterExportRows,
} from "@/lib/export/build-sheet-export";

const columns: SheetColumn[] = [
  {
    id: "col-1",
    sheet_id: "sheet-1",
    org_id: "org-1",
    key: "name",
    label: "Name",
    type: "text",
    position: 0,
    width: 120,
    is_primary: true,
    is_pinned: false,
    is_hidden: false,
    config: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "col-2",
    sheet_id: "sheet-1",
    org_id: "org-1",
    key: "secret",
    label: "Secret",
    type: "text",
    position: 1,
    width: 120,
    is_primary: false,
    is_pinned: false,
    is_hidden: true,
    config: {},
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

const rows: Row[] = [
  {
    id: "row-1",
    sheet_id: "sheet-1",
    org_id: "org-1",
    position: 0,
    data: { name: "Acme", secret: "hidden" },
    is_hidden: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    search_vector: null,
  },
];

describe("buildSheetExportMatrix", () => {
  it("excludes hidden columns by default", () => {
    const exportColumns = filterExportColumns(columns, false);
    const matrix = buildSheetExportMatrix(exportColumns, filterExportRows(rows, false));
    expect(matrix[0]).toEqual(["Name"]);
    expect(matrix[1]).toEqual(["Acme"]);
  });

  it("escapes csv values with commas", () => {
    const matrix = [
      ["Name"],
      ["Acme, Inc"],
    ];
    expect(buildCsvContent(matrix)).toContain('"Acme, Inc"');
  });
});
