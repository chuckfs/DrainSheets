import { describe, expect, it } from "vitest";
import { canEditSheetContent } from "@/lib/permissions/sheet";
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
  it("allows org admins and owners to import via editor access", () => {
    expect(canEditSheetContent(profile("admin"))).toBe(true);
    expect(canEditSheetContent(profile("owner"))).toBe(true);
  });

  it("allows workspace editors to import sheet content", () => {
    expect(canEditSheetContent(profile("editor"), "editor")).toBe(true);
    expect(canEditSheetContent(profile("editor"), "viewer")).toBe(false);
  });
});
