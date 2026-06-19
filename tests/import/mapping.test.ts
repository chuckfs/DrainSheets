import { describe, expect, it } from "vitest";
import { autoMapToTemplateColumns, isTemplateMappingComplete } from "@/lib/import/mapping";
import { parseTemplateColumns } from "@/lib/templates/template-utils";

const TENANT_COLUMNS = parseTemplateColumns([
  { key: "company", label: "Company", type: "text", position: 0, is_primary: true, is_pinned: true, width: null, config: {} },
  { key: "contact", label: "Contact", type: "contact", position: 1, is_primary: false, is_pinned: true, width: null, config: {} },
  { key: "status", label: "Status", type: "select", position: 2, is_primary: false, is_pinned: true, width: null, config: {} },
]);

describe("import mapping", () => {
  it("auto-maps tenant prospect headers", () => {
    const columns = ["Tenant/Company", "Contact Email", "Status", "Use", "Website"];
    const mapping = autoMapToTemplateColumns(columns, TENANT_COLUMNS);

    expect(mapping["Tenant/Company"]?.targetKey).toBe("company");
    expect(mapping["Contact Email"]?.targetKey).toBe("contact");
    expect(mapping.Status?.targetKey).toBe("status");
    expect(isTemplateMappingComplete(mapping, TENANT_COLUMNS)).toBe(true);
  });

  it("auto-maps deal tracker headers", () => {
    const dealColumns = parseTemplateColumns([
      { key: "address", label: "Address", type: "text", position: 0, is_primary: true, is_pinned: true, width: null, config: {} },
      { key: "purchase_price", label: "Purchase Price", type: "currency", position: 1, is_primary: false, is_pinned: true, width: null, config: {} },
      { key: "stage", label: "Stage", type: "select", position: 4, is_primary: false, is_pinned: false, width: null, config: {} },
    ]);

    const mapping = autoMapToTemplateColumns(
      ["Property Address", "Purchase Price", "Stage"],
      dealColumns,
    );

    expect(mapping["Property Address"]?.targetKey).toBe("address");
    expect(mapping["Purchase Price"]?.targetKey).toBe("purchase_price");
    expect(mapping.Stage?.targetKey).toBe("stage");
  });
});
