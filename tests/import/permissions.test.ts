import { describe, expect, it } from "vitest";
import { canCreateProperty, canEditProspect } from "@/lib/permissions/property";
import { canEditContact } from "@/lib/permissions/contact";
import type { Profile } from "@/types/domain";

function profile(role: Profile["role"]): Profile {
  return {
    id: "user-1",
    org_id: "org-1",
    role,
    email: "user@example.com",
    name: "User",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("import permissions", () => {
  it("allows admins to import properties", () => {
    expect(canCreateProperty(profile("admin"))).toBe(true);
    expect(canCreateProperty(profile("editor"))).toBe(false);
  });

  it("allows editors to import prospects and contacts but not properties", () => {
    expect(canEditProspect(profile("editor"))).toBe(true);
    expect(canEditContact(profile("editor"))).toBe(true);
    expect(canCreateProperty(profile("editor"))).toBe(false);
    expect(canCreateProperty(profile("admin"))).toBe(true);
  });
});
