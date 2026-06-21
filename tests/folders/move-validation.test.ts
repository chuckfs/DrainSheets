import { describe, expect, it } from "vitest";
import {
  isSameFolderParent,
  isSameSheetFolder,
  wouldCreateFolderCycle,
} from "@/lib/folders/move-validation";

describe("folder move validation", () => {
  const folders = [
    { id: "root", parent_folder_id: null },
    { id: "child", parent_folder_id: "root" },
    { id: "grandchild", parent_folder_id: "child" },
  ];

  it("detects same parent as no-op", () => {
    expect(isSameFolderParent("child", "root", folders)).toBe(true);
    expect(isSameFolderParent("root", null, folders)).toBe(true);
  });

  it("blocks moving a folder into itself", () => {
    expect(wouldCreateFolderCycle("child", "child", folders)).toBe(true);
  });

  it("blocks moving a folder into a descendant", () => {
    expect(wouldCreateFolderCycle("root", "grandchild", folders)).toBe(true);
  });

  it("allows moving a folder to workspace root", () => {
    expect(wouldCreateFolderCycle("child", null, folders)).toBe(false);
  });

  it("detects same sheet folder as no-op", () => {
    expect(isSameSheetFolder("root", "root")).toBe(true);
    expect(isSameSheetFolder(null, null)).toBe(true);
    expect(isSameSheetFolder("root", null)).toBe(false);
  });
});
