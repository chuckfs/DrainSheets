export type FolderHierarchyNode = {
  id: string;
  parent_folder_id: string | null;
};

export function collectSubtreeFolderIds(
  rootFolderId: string,
  folders: FolderHierarchyNode[],
): Set<string> {
  const subtree = new Set<string>([rootFolderId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const folder of folders) {
      if (
        folder.parent_folder_id &&
        subtree.has(folder.parent_folder_id) &&
        !subtree.has(folder.id)
      ) {
        subtree.add(folder.id);
        changed = true;
      }
    }
  }

  return subtree;
}

export function countFolderSubtreeContents(
  rootFolderId: string,
  folders: FolderHierarchyNode[],
  sheetFolderIds: Array<string | null>,
): { subfolderCount: number; sheetCount: number } {
  const subtree = collectSubtreeFolderIds(rootFolderId, folders);
  const sheetCount = sheetFolderIds.filter(
    (folderId) => folderId !== null && subtree.has(folderId),
  ).length;

  return {
    subfolderCount: Math.max(subtree.size - 1, 0),
    sheetCount,
  };
}
