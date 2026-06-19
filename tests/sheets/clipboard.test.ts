import { describe, expect, it } from "vitest";
import {
  cellValueToTsv,
  parseClipboardValue,
  parseTsv,
  serializeRangeToTsv,
} from "@/lib/sheets/clipboard";

describe("sheet clipboard TSV", () => {
  it("serializes a single cell", () => {
    const tsv = serializeRangeToTsv(
      () => "Acme",
      0,
      0,
      0,
      0,
    );

    expect(tsv).toBe("Acme");
  });

  it("serializes a rectangular range with tabs and newlines", () => {
    const grid = [
      ["A1", "B1"],
      ["A2", "B2"],
    ];

    const tsv = serializeRangeToTsv(
      (row, col) => grid[row]?.[col],
      0,
      1,
      0,
      1,
    );

    expect(tsv).toBe("A1\tB1\nA2\tB2");
  });

  it("escapes tabs and newlines in cell text", () => {
    expect(cellValueToTsv("line\nbreak")).toBe("line break");
    expect(cellValueToTsv("tab\there")).toBe("tab here");
  });

  it("serializes booleans as TRUE/FALSE", () => {
    expect(cellValueToTsv(true)).toBe("TRUE");
    expect(cellValueToTsv(false)).toBe("FALSE");
  });

  it("parses TSV into a matrix", () => {
    expect(parseTsv("a\tb\nc\td")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("normalizes CRLF line endings", () => {
    expect(parseTsv("a\tb\r\nc\td")).toEqual([
      ["a", "b"],
      ["c", "d"],
    ]);
  });

  it("parses clipboard values for text, numbers, and booleans", () => {
    expect(parseClipboardValue("")).toBeNull();
    expect(parseClipboardValue("TRUE")).toBe(true);
    expect(parseClipboardValue("FALSE")).toBe(false);
    expect(parseClipboardValue("42")).toBe(42);
    expect(parseClipboardValue("3.14")).toBe(3.14);
    expect(parseClipboardValue("hello")).toBe("hello");
  });
});
