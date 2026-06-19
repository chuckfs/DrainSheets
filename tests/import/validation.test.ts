import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { inferColumns } from "@/lib/import/infer-columns";
import { autoMapToTemplateColumns } from "@/lib/import/mapping";
import { parseImportBuffer } from "@/lib/import/parser";
import { mapRowToSheetData } from "@/lib/import/transform";
import { extractEmail } from "@/lib/import/transform";
import { parseTemplateColumns } from "@/lib/templates/template-utils";

const FIXTURES_DIR = join(process.cwd(), "tests/fixtures/import");

const TEMPLATE_FIXTURES = [
  {
    key: "tenant_prospect_list",
    file: "tenant_prospect_list.csv",
    templateColumns: [
      { key: "company", label: "Company", type: "text", position: 0, is_primary: true, is_pinned: true, width: null, config: {} },
      { key: "contact", label: "Contact", type: "contact", position: 1, is_primary: false, is_pinned: true, width: null, config: {} },
      { key: "status", label: "Status", type: "select", position: 2, is_primary: false, is_pinned: true, width: null, config: {} },
      { key: "use", label: "Use", type: "text", position: 3, is_primary: false, is_pinned: false, width: null, config: {} },
      { key: "website", label: "Website", type: "url", position: 4, is_primary: false, is_pinned: false, width: null, config: {} },
      { key: "comments", label: "Comments", type: "long_text", position: 5, is_primary: false, is_pinned: false, width: null, config: {} },
    ],
    expectedMappedKeys: ["company", "contact", "status"],
  },
  {
    key: "deal_tracker",
    file: "deal_tracker.csv",
    templateColumns: [
      { key: "address", label: "Address", type: "text", position: 0, is_primary: true, is_pinned: true, width: null, config: {} },
      { key: "purchase_price", label: "Purchase Price", type: "currency", position: 1, is_primary: false, is_pinned: true, width: null, config: {} },
      { key: "ppsf", label: "PPSF", type: "currency", position: 2, is_primary: false, is_pinned: false, width: null, config: {} },
      { key: "nnn", label: "NNN", type: "text", position: 3, is_primary: false, is_pinned: false, width: null, config: {} },
      { key: "stage", label: "Stage", type: "select", position: 4, is_primary: false, is_pinned: false, width: null, config: {} },
    ],
    expectedMappedKeys: ["address", "purchase_price", "stage"],
  },
  {
    key: "contact_database",
    file: "contact_database.csv",
    templateColumns: [
      { key: "first_name", label: "First Name", type: "text", position: 0, is_primary: true, is_pinned: true, width: null, config: {} },
      { key: "last_name", label: "Last Name", type: "text", position: 1, is_primary: false, is_pinned: true, width: null, config: {} },
      { key: "email", label: "Email", type: "email", position: 2, is_primary: false, is_pinned: false, width: null, config: {} },
      { key: "phone", label: "Phone", type: "phone", position: 3, is_primary: false, is_pinned: false, width: null, config: {} },
      { key: "title", label: "Title", type: "text", position: 4, is_primary: false, is_pinned: false, width: null, config: {} },
      { key: "company", label: "Company", type: "text", position: 5, is_primary: false, is_pinned: false, width: null, config: {} },
    ],
    expectedMappedKeys: ["first_name", "last_name", "email"],
  },
] as const;

function loadFixtureBuffer(fileName: string): ArrayBuffer {
  const buffer = readFileSync(join(FIXTURES_DIR, fileName));
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

function csvToXlsxBuffer(csvFileName: string): ArrayBuffer {
  const csv = readFileSync(join(FIXTURES_DIR, csvFileName), "utf8");
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(","));
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Import");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" });
}

describe("import validation — CSV", () => {
  for (const fixture of TEMPLATE_FIXTURES) {
    it(`parses and maps ${fixture.key} CSV`, () => {
      const parsed = parseImportBuffer(loadFixtureBuffer(fixture.file), fixture.file);
      expect(parsed.success).toBe(true);
      if (!parsed.success) {
        return;
      }

      expect(parsed.data.rows.length).toBeGreaterThan(0);

      const templateColumns = parseTemplateColumns(fixture.templateColumns);
      const mapping = autoMapToTemplateColumns(parsed.data.columns, templateColumns);
      const columnTypes = Object.fromEntries(templateColumns.map((column) => [column.key, column.type]));

      for (const key of fixture.expectedMappedKeys) {
        expect(Object.values(mapping).some((entry) => entry.targetKey === key)).toBe(true);
      }

      const firstRow = mapRowToSheetData(parsed.data.rows[0]!, mapping, columnTypes);
      expect(Object.keys(firstRow).length).toBeGreaterThan(0);

      if (fixture.key === "tenant_prospect_list") {
        expect(firstRow.status).toBe("interested");
        expect(extractEmail(parsed.data.rows[0]?.["Contact Email"])).toBe("contact@acme.com");
      }

      if (fixture.key === "deal_tracker") {
        expect(typeof firstRow.purchase_price).toBe("number");
        expect(firstRow.stage).toBe("under_contract");
      }

      if (fixture.key === "contact_database") {
        expect(firstRow.email).toBe("jane@example.com");
      }
    });
  }
});

describe("import validation — XLSX", () => {
  for (const fixture of TEMPLATE_FIXTURES) {
    it(`parses and maps ${fixture.key} XLSX`, () => {
      const xlsxName = fixture.file.replace(".csv", ".xlsx");
      const parsed = parseImportBuffer(csvToXlsxBuffer(fixture.file), xlsxName);
      expect(parsed.success).toBe(true);
      if (!parsed.success) {
        return;
      }

      const inferred = inferColumns(parsed.data.columns, parsed.data.rows);
      expect(inferred.length).toBe(parsed.data.columns.length);
      expect(parsed.data.rows.length).toBeGreaterThan(0);
    });
  }
});
