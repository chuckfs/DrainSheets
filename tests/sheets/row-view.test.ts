import { describe, expect, it } from "vitest";
import { isRowViewActive, sortRows, type RowSort } from "@/lib/sheets/row-view";
import type { Json } from "@/types/database";
import type { Row, SheetColumn } from "@/types/domain";

function makeColumn(key: string, type: SheetColumn["type"]): SheetColumn {
  return {
    id: `col-${key}`,
    sheet_id: "sheet-1",
    org_id: "org-1",
    key,
    label: key,
    type,
    position: 0,
    width: null,
    is_primary: false,
    is_pinned: false,
    config: {} as Json,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeRow(id: string, data: Record<string, Json | undefined>): Row {
  return {
    id,
    sheet_id: "sheet-1",
    org_id: "org-1",
    position: 0,
    data: data as Json,
    created_by: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    search_vector: null,
  };
}

const asc = (columnKey: string): RowSort => ({ columnKey, direction: "asc" });
const desc = (columnKey: string): RowSort => ({ columnKey, direction: "desc" });
const ids = (rows: Row[]) => rows.map((row) => row.id);

describe("isRowViewActive", () => {
  it("is inactive only when there is no sort and no filters", () => {
    expect(isRowViewActive(null, [])).toBe(false);
    expect(isRowViewActive(asc("name"), [])).toBe(true);
    expect(isRowViewActive(null, [{ columnKey: "name", operator: "contains", value: "x" }])).toBe(
      true,
    );
  });
});

describe("sortRows: type-aware ordering", () => {
  const numberColumns = [makeColumn("price", "number")];
  const numberRows = [
    makeRow("r100", { price: "100" }),
    makeRow("r9", { price: "9" }),
    makeRow("r20", { price: "20" }),
  ];

  it("sorts number columns numerically, not as text", () => {
    // Text sort would put "100" before "20" before "9"; numeric must not.
    expect(ids(sortRows(numberRows, asc("price"), numberColumns))).toEqual(["r9", "r20", "r100"]);
    expect(ids(sortRows(numberRows, desc("price"), numberColumns))).toEqual(["r100", "r20", "r9"]);
  });

  it("sorts currency columns numerically, ignoring symbols/commas", () => {
    const columns = [makeColumn("amount", "currency")];
    const rows = [
      makeRow("a", { amount: "$1,000" }),
      makeRow("b", { amount: "$90" }),
      makeRow("c", { amount: "$250" }),
    ];
    expect(ids(sortRows(rows, asc("amount"), columns))).toEqual(["b", "c", "a"]);
  });

  it("sorts date columns chronologically", () => {
    const columns = [makeColumn("closed", "date")];
    const rows = [
      makeRow("mar", { closed: "2026-03-01" }),
      makeRow("jan", { closed: "2026-01-15" }),
      makeRow("feb", { closed: "2026-02-10" }),
    ];
    expect(ids(sortRows(rows, asc("closed"), columns))).toEqual(["jan", "feb", "mar"]);
  });

  it("sorts text columns alphabetically (case-insensitive)", () => {
    const columns = [makeColumn("name", "text")];
    const rows = [
      makeRow("b", { name: "banana" }),
      makeRow("a", { name: "Apple" }),
      makeRow("c", { name: "cherry" }),
    ];
    expect(ids(sortRows(rows, asc("name"), columns))).toEqual(["a", "b", "c"]);
  });
});

describe("sortRows: empties and safety", () => {
  const columns = [makeColumn("name", "text")];

  it("always sorts empty cells last, in both directions", () => {
    const rows = [
      makeRow("b", { name: "b" }),
      makeRow("empty", { name: "" }),
      makeRow("a", { name: "a" }),
    ];
    expect(ids(sortRows(rows, asc("name"), columns))).toEqual(["a", "b", "empty"]);
    expect(ids(sortRows(rows, desc("name"), columns))).toEqual(["b", "a", "empty"]);
  });

  it("treats missing keys as empty (sorted last)", () => {
    const rows = [makeRow("has", { name: "a" }), makeRow("missing", {})];
    expect(ids(sortRows(rows, asc("name"), columns))).toEqual(["has", "missing"]);
  });

  it("returns rows unchanged when the sort column does not exist", () => {
    const rows = [makeRow("x", { name: "z" }), makeRow("y", { name: "a" })];
    expect(ids(sortRows(rows, asc("nonexistent"), columns))).toEqual(["x", "y"]);
  });

  it("does not mutate the input array", () => {
    const rows = [makeRow("b", { name: "b" }), makeRow("a", { name: "a" })];
    const original = ids(rows);
    sortRows(rows, asc("name"), columns);
    expect(ids(rows)).toEqual(original);
  });
});
