import { describe, expect, it } from "vitest";
import { collectSubtreeFolderIds, countFolderSubtreeContents } from "@/lib/folders/subtree";

describe("folder subtree", () => {
  const folders = [
    { id: "root", parent_folder_id: null },
    { id: "child-a", parent_folder_id: "root" },
    { id: "child-b", parent_folder_id: "root" },
    { id: "grandchild", parent_folder_id: "child-a" },
  ];

  it("collects nested folder ids", () => {
    const subtree = collectSubtreeFolderIds("root", folders);
    expect(Array.from(subtree).sort()).toEqual(["child-a", "child-b", "grandchild", "root"]);
  });

  it("counts sheets in a folder subtree", () => {
    const counts = countFolderSubtreeContents("root", folders, [
      "root",
      "child-a",
      "child-b",
      "other",
      null,
    ]);

    expect(counts).toEqual({ subfolderCount: 3, sheetCount: 3 });
  });
});
