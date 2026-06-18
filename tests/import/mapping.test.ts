import { describe, expect, it } from "vitest";
import { autoMapColumns, isMappingComplete } from "@/lib/import/mapping";

describe("import mapping", () => {
  it("auto-maps tenant prospect sheet columns", () => {
    const columns = ["Tenant/Company", "Use", "Website", "Contact Name", "Title"];
    const mapping = autoMapColumns(columns, "prospect", "tenant_prospect");

    expect(mapping["Tenant/Company"]).toBe("company_name");
    expect(mapping.Use).toBe("category");
    expect(mapping.Website).toBe("website");
    expect(isMappingComplete(mapping, "prospect")).toBe(true);
  });

  it("auto-maps property search sheet columns", () => {
    const columns = ["Property Address", "Purchase Price", "PPSF", "NNN Expenses"];
    const mapping = autoMapColumns(columns, "property", "property_search");

    expect(mapping["Property Address"]).toBe("address");
    expect(mapping["Purchase Price"]).toBe("description");
  });

  it("maps obvious aliases without a template", () => {
    const columns = ["Contact Name", "Email Address", "Phone Number"];
    const mapping = autoMapColumns(columns, "contact", "none");

    expect(mapping["Contact Name"]).toBe("first_name");
    expect(mapping["Email Address"]).toBe("email");
    expect(mapping["Phone Number"]).toBe("phone");
  });
});
