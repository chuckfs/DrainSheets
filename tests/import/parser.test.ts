import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { parseImportBuffer } from "@/lib/import/parser";

describe("import parser", () => {
  it("parses CSV content with headers and skips empty rows", () => {
    const csv = "Tenant/Company,Use,Website\nAcme Corp,Retail,acme.com\n\nBeta LLC,Office,\n";
    const buffer = new TextEncoder().encode(csv).buffer;

    const result = parseImportBuffer(buffer, "tenants.csv");
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.columns).toEqual(["Tenant/Company", "Use", "Website"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.["Tenant/Company"]).toBe("Acme Corp");
  });

  it("parses XLSX workbooks", () => {
    const sheet = XLSX.utils.aoa_to_sheet([
      ["Property Address", "Purchase Price"],
      ["123 Main St", "$1,000,000"],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Properties");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = parseImportBuffer(buffer, "properties.xlsx");
    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.columns).toContain("Property Address");
    expect(result.rows[0]?.["Property Address"]).toBe("123 Main St");
  });

  it("rejects unsupported file types", () => {
    const buffer = new ArrayBuffer(8);
    const result = parseImportBuffer(buffer, "notes.txt");
    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error).toMatch(/unsupported/i);
  });
});
