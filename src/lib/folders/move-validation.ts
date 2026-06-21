import { collectSubtreeFolderIds, type FolderHierarchyNode } from "./subtree";

export function isSameFolderParent(
  folderId: string,
  targetParentFolderId: string | null,
  folders: FolderHierarchyNode[],
): boolean {
  const folder = folders.find((entry) => entry.id === folderId);
  return folder?.parent_folder_id === targetParentFolderId;
}

export function wouldCreateFolderCycle(
  folderId: string,
  targetParentFolderId: string | null,
  folders: FolderHierarchyNode[],
): boolean {
  if (targetParentFolderId === null) {
    return false;
  }

  if (folderId === targetParentFolderId) {
    return true;
  }

  const subtree = collectSubtreeFolderIds(folderId, folders);
  return subtree.has(targetParentFolderId);
}

export function isSameSheetFolder(
  sheetFolderId: string | null,
  targetFolderId: string | null,
): boolean {
  return sheetFolderId === targetFolderId;
}
