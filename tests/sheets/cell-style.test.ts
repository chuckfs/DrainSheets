import { describe, expect, it } from "vitest";
import {
  getCellStyleFromRow,
  mergeCellStyle,
  parseRowStyles,
  resolveFillColor,
  setCellStyleOnRow,
  styleToHistoryJson,
  fillPresetStorageValue,
} from "@/lib/sheets/cell-style";
import type { Row } from "@/types/domain";

function makeRow(styles: Record<string, unknown> = {}): Row {
  return {
    id: "row-1",
    sheet_id: "sheet-1",
    org_id: "org-1",
    position: 0,
    data: {},
    height: null,
    is_hidden: false,
    styles: styles as Row["styles"],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    created_by: null,
    search_vector: null,
  };
}

describe("cell-style", () => {
  it("parses and normalizes row styles", () => {
    const parsed = parseRowStyles({
      title: { bold: true, color: "#ff0000", align: "center" },
      notes: { italic: true, color: "not-a-color" },
    });

    expect(parsed.title).toEqual({ bold: true, color: "#ff0000", align: "center" });
    expect(parsed.notes).toEqual({ italic: true });
  });

  it("merges patches and clears empty values", () => {
    const merged = mergeCellStyle({ bold: true, color: "#111827" }, {
      bold: false,
      italic: true,
      color: undefined,
    });

    expect(merged).toEqual({ italic: true });
  });

  it("sets and removes styles on a row", () => {
    const row = makeRow({ title: { bold: true } });
    const styled = setCellStyleOnRow(row, "title", { bold: true, underline: true });
    expect(getCellStyleFromRow(styled, "title")).toEqual({ bold: true, underline: true });

    const cleared = setCellStyleOnRow(styled, "title", null);
    expect(parseRowStyles(cleared.styles)).toEqual({});
  });

  it("serializes styles for history", () => {
    expect(styleToHistoryJson({ bold: true })).toEqual({ bold: true });
    expect(styleToHistoryJson({})).toBeNull();
  });

  it("resolves fill presets for light and dark themes", () => {
    const stored = fillPresetStorageValue("green");
    expect(resolveFillColor(stored, false)).toBe("#dcfce7");
    expect(resolveFillColor(stored, true)).toBe("#14532d");
  });

  it("maps legacy light fill hex values to dark theme colors", () => {
    expect(resolveFillColor("#dcfce7", true)).toBe("#14532d");
    expect(resolveFillColor("#fef9c3", true)).toBe("#422006");
  });
});
