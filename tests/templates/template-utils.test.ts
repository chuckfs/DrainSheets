import { describe, expect, it } from "vitest";
import { buildUserTemplateKey } from "@/lib/templates/template-utils";

describe("buildUserTemplateKey", () => {
  it("slugifies the template name with a user prefix", () => {
    const key = buildUserTemplateKey("My Prospect List");
    expect(key.startsWith("user_my_prospect_list_")).toBe(true);
  });

  it("falls back when the name has no slug characters", () => {
    const key = buildUserTemplateKey("!!!");
    expect(key.startsWith("user_template_")).toBe(true);
  });
});
