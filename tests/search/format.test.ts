import { describe, expect, it } from "vitest";
import {
  flattenGroupedResults,
  groupSearchResults,
  searchResultHref,
  type SearchResult,
} from "@/lib/search/format";
import { highlightMatch } from "@/lib/search/highlight";

const baseResult = (overrides: Partial<SearchResult>): SearchResult => ({
  entity_type: "sheet",
  entity_id: "11111111-1111-1111-1111-111111111111",
  title: "Test",
  sheet_id: null,
  workspace_id: null,
  rank: 1,
  sheet_name: null,
  workspace_name: null,
  ...overrides,
});

describe("search format — routing", () => {
  it("routes sheets to sheet page", () => {
    expect(
      searchResultHref(
        baseResult({ entity_type: "sheet", entity_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }),
      ),
    ).toBe("/sheets/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
  });

  it("routes rows with row query param", () => {
    expect(
      searchResultHref(
        baseResult({
          entity_type: "row",
          entity_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          sheet_id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        }),
      ),
    ).toBe("/sheets/cccccccc-cccc-cccc-cccc-cccccccccccc?row=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
  });

  it("routes contacts to contact page", () => {
    expect(
      searchResultHref(
        baseResult({
          entity_type: "contact",
          entity_id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
        }),
      ),
    ).toBe("/contacts/dddddddd-dddd-dddd-dddd-dddddddddddd");
  });

  it("routes documents to document page", () => {
    expect(
      searchResultHref(
        baseResult({
          entity_type: "document",
          entity_id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
        }),
      ),
    ).toBe("/documents/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
  });

  it("routes notes with note query param", () => {
    expect(
      searchResultHref(
        baseResult({
          entity_type: "note",
          entity_id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
          sheet_id: "11111111-1111-1111-1111-111111111111",
        }),
      ),
    ).toBe("/sheets/11111111-1111-1111-1111-111111111111?note=ffffffff-ffff-ffff-ffff-ffffffffffff");
  });
});

describe("search format — grouping", () => {
  it("groups results by entity type in stable order", () => {
    const results: SearchResult[] = [
      baseResult({ entity_type: "contact", entity_id: "c1", title: "Contact" }),
      baseResult({ entity_type: "sheet", entity_id: "s1", title: "Sheet" }),
      baseResult({ entity_type: "row", entity_id: "r1", title: "Row", sheet_id: "s1" }),
    ];

    const grouped = groupSearchResults(results);
    expect(grouped.sheet).toHaveLength(1);
    expect(grouped.row).toHaveLength(1);
    expect(grouped.contact).toHaveLength(1);

    const flat = flattenGroupedResults(grouped);
    expect(flat.map((item) => item.entity_type)).toEqual(["sheet", "row", "contact"]);
  });
});

describe("search highlight", () => {
  it("highlights matching substring case-insensitively", () => {
    const parts = highlightMatch("Root Sheet", "root");
    expect(parts).toEqual([
      { text: "Root", match: true },
      { text: " Sheet", match: false },
    ]);
  });

  it("returns full text when no match", () => {
    expect(highlightMatch("Folder Sheet", "xyz")).toEqual([{ text: "Folder Sheet", match: false }]);
  });
});
