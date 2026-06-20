import { describe, expect, it } from "vitest";
import { createSheetViewSchema } from "@/lib/validations/sheet-view";

describe("createSheetViewSchema", () => {
  it("accepts a valid saved view payload", () => {
    const parsed = createSheetViewSchema.safeParse({
      sheetId: "550e8400-e29b-41d4-a716-446655440000",
      name: "Active tenants",
      sort: { columnKey: "name", direction: "asc" },
      filters: [{ columnKey: "name", operator: "contains", value: "Acme" }],
      hiddenColumnKeys: ["secret"],
      hiddenRowIds: [],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects an empty view name", () => {
    const parsed = createSheetViewSchema.safeParse({
      sheetId: "550e8400-e29b-41d4-a716-446655440000",
      name: "",
    });

    expect(parsed.success).toBe(false);
  });
});
