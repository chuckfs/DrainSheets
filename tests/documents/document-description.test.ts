import { describe, expect, it } from "vitest";
import { updateDocumentDescriptionSchema } from "@/lib/validations/document";

describe("updateDocumentDescriptionSchema", () => {
  it("accepts null and trimmed descriptions", () => {
    expect(
      updateDocumentDescriptionSchema.safeParse({
        documentId: "00000000-0000-4000-8000-000000000001",
        description: null,
      }).success,
    ).toBe(true);

    expect(
      updateDocumentDescriptionSchema.safeParse({
        documentId: "00000000-0000-4000-8000-000000000001",
        description: "Offering memorandum",
      }).success,
    ).toBe(true);
  });

  it("rejects descriptions over 1000 characters", () => {
    expect(
      updateDocumentDescriptionSchema.safeParse({
        documentId: "00000000-0000-4000-8000-000000000001",
        description: "x".repeat(1001),
      }).success,
    ).toBe(false);
  });
});
