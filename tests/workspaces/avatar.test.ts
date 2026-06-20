import { describe, expect, it } from "vitest";
import {
  previewWorkspacePaletteIndex,
  workspaceInitials,
  workspacePaletteIndex,
  WORKSPACE_PALETTE_SIZE,
} from "@/lib/workspaces/avatar";

describe("workspace avatar identity", () => {
  it("derives initials from workspace names", () => {
    expect(workspaceInitials("A-TEAM Master INFO")).toBe("AI");
    expect(workspaceInitials("Acme")).toBe("AC");
    expect(workspaceInitials("")).toBe("?");
  });

  it("assigns a stable palette slot from workspace id", () => {
    const index = workspacePaletteIndex("00000000-0000-0000-0000-000000000001");
    expect(index).toBeGreaterThanOrEqual(0);
    expect(index).toBeLessThan(WORKSPACE_PALETTE_SIZE);
    expect(workspacePaletteIndex("00000000-0000-0000-0000-000000000001")).toBe(index);
  });

  it("uses name-based preview palette before id exists", () => {
    expect(previewWorkspacePaletteIndex("Preview Workspace")).toBeGreaterThanOrEqual(0);
    expect(previewWorkspacePaletteIndex("Preview Workspace")).toBeLessThan(WORKSPACE_PALETTE_SIZE);
  });
});
