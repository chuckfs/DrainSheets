import { describe, expect, it } from "vitest";
import { buildImportPreview } from "@/lib/import/preview";

describe("import preview", () => {
  it("summarizes valid, duplicate, and empty rows", () => {
    const rows = [
      { Company: "Acme Corp", Status: "interested" },
      { Company: "Acme Corp", Status: "interested" },
      { Company: "", Status: "passed" },
    ];

    const mapping = {
      Company: { sourceHeader: "Company", targetKey: "company" },
      Status: { sourceHeader: "Status", targetKey: "status" },
    };

    const preview = buildImportPreview({
      rows,
      mapping,
      columnTypes: { company: "text", status: "select" },
      dedupe: { enabled: true, sourceColumn: "Company" },
    });

    expect(preview.totalRows).toBe(3);
    expect(preview.validRows).toBe(2);
    expect(preview.duplicateRows).toBe(1);
    expect(preview.invalidRows).toBe(0);
    expect(preview.previewRows).toHaveLength(2);
  });
});
