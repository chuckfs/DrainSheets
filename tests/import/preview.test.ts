import { describe, expect, it } from "vitest";
import { buildImportPreview } from "@/lib/import/preview";

describe("import preview", () => {
  it("summarizes valid, duplicate, and invalid rows", () => {
    const rows = [
      { "Tenant/Company": "Acme Corp", Use: "Retail", Website: "https://acme.com" },
      { "Tenant/Company": "Acme Corp", Use: "Retail", Website: "https://acme.com" },
      { "Tenant/Company": "", Use: "Retail", Website: "bad-url" },
    ];

    const mapping = {
      "Tenant/Company": "company_name" as const,
      Use: "category" as const,
      Website: "website" as const,
    };

    const preview = buildImportPreview({
      mode: "prospect",
      rows,
      mapping,
      template: "tenant_prospect",
      existingKeys: [],
      skipDuplicates: true,
    });

    expect(preview.totalRows).toBe(3);
    expect(preview.validRows).toBe(1);
    expect(preview.duplicateRows).toBe(1);
    expect(preview.invalidRows).toBe(1);
    expect(preview.skippedRows).toBe(1);
  });
});
