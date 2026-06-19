import { describe, expect, it } from "vitest";
import { classifyRowDedupe, filterRowsWithDedupe, normalizeDedupeKey } from "@/lib/import/dedupe";

describe("import dedupe", () => {
  it("normalizes dedupe keys", () => {
    expect(normalizeDedupeKey("  Acme Corp ")).toBe("acme corp");
  });

  it("skips duplicate rows in file by source column", () => {
    const rows = [
      { Company: "Acme Corp", Status: "lead" },
      { Company: "Acme Corp", Status: "closed" },
      { Company: "Beta LLC", Status: "lead" },
    ];

    const result = filterRowsWithDedupe(rows, "Company", true);
    expect(result.rows).toHaveLength(2);
    expect(result.duplicateCount).toBe(1);
  });

  it("classifies first occurrence as unique", () => {
    const seen = new Set<string>();
    const status = classifyRowDedupe({ Company: "Acme" }, "Company", seen);
    expect(status).toBe("unique");
    expect(classifyRowDedupe({ Company: "Acme" }, "Company", seen)).toBe("duplicate_in_file");
  });
});
