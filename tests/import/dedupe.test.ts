import { describe, expect, it } from "vitest";
import {
  buildDedupeScope,
  classifyRowDedupe,
  dedupeKeyForRecord,
  normalizeDedupeKey,
} from "@/lib/import/dedupe";

describe("import dedupe", () => {
  it("normalizes dedupe keys", () => {
    expect(normalizeDedupeKey("  Acme Corp ")).toBe("acme corp");
  });

  it("detects property duplicates by name", () => {
    const key = dedupeKeyForRecord("property", { name: "Harbor Plaza" });
    expect(key).toBe("harbor plaza");
  });

  it("flags existing prospect duplicates", () => {
    const scope = buildDedupeScope("prospect", ["Acme Corp"]);
    const status = classifyRowDedupe(
      "prospect",
      { company_name: "acme corp" },
      scope,
    );
    expect(status).toBe("duplicate_existing");
  });

  it("flags in-file contact duplicates by email", () => {
    const scope = buildDedupeScope("contact", []);
    classifyRowDedupe("contact", { email: "a@example.com" }, scope);
    const second = classifyRowDedupe("contact", { email: "a@example.com" }, scope);
    expect(second).toBe("duplicate_in_file");
  });
});
