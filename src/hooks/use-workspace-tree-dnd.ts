"use client";

import { useCallback, useState, useTransition } from "react";
import { moveFolder } from "@/actions/folders";
import { moveSheet } from "@/actions/sheets";
import type { FolderHierarchyNode } from "@/lib/folders/subtree";
import {
  isSameFolderParent,
  isSameSheetFolder,
  wouldCreateFolderCycle,
} from "@/lib/folders/move-validation";
import {
  readTreeDragItem,
  setTreeDragItem,
  WORKSPACE_ROOT_DROP_ID,
  type TreeDragItem,
} from "@/lib/workspaces/tree-dnd";
import { toast } from "sonner";

export function useWorkspaceTreeDnD({
  canEdit,
  folders,
  sheets,
  onRefresh,
}: {
  canEdit: boolean;
  folders: FolderHierarchyNode[];
  sheets: Array<{ id: string; folder_id: string | null }>;
  onRefresh: () => void;
}) {
  const [dragging, setDragging] = useState<TreeDragItem | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isMoving, startMove] = useTransition();

  const canDropOnFolder = useCallback(
    (folderId: string, item: TreeDragItem | null = dragging): boolean => {
      if (!item) {
        return false;
      }

      if (item.type === "folder") {
        if (item.id === folderId) {
          return false;
        }
        if (wouldCreateFolderCycle(item.id, folderId, folders)) {
          return false;
        }
        if (isSameFolderParent(item.id, folderId, folders)) {
          return false;
        }
        return true;
      }

      const sheet = sheets.find((entry) => entry.id === item.id);
      if (!sheet) {
        return false;
      }

      return !isSameSheetFolder(sheet.folder_id, folderId);
    },
    [dragging, folders, sheets],
  );

  const canDropOnRoot = useCallback(
    (item: TreeDragItem | null = dragging): boolean => {
      if (!item) {
        return false;
      }

      if (item.type === "folder") {
        if (isSameFolderParent(item.id, null, folders)) {
          return false;
        }
        return true;
      }

      const sheet = sheets.find((entry) => entry.id === item.id);
      if (!sheet) {
        return false;
      }

      return sheet.folder_id !== null;
    },
    [dragging, folders, sheets],
  );

  const handleDragStart = useCallback(
    (event: React.DragEvent, item: TreeDragItem) => {
      if (!canEdit) {
        event.preventDefault();
        return;
      }

      setTreeDragItem(event.dataTransfer, item);
      setDragging(item);
    },
    [canEdit],
  );

  const handleDragEnd = useCallback(() => {
    setDragging(null);
    setDropTargetId(null);
  }, []);

  const handleFolderDragOver = useCallback(
    (event: React.DragEvent, folderId: string) => {
      if (!canEdit) {
        return;
      }

      const item = dragging ?? readTreeDragItem(event.dataTransfer);
      if (!canDropOnFolder(folderId, item)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "move";
      setDropTargetId(folderId);
    },
    [canDropOnFolder, canEdit, dragging],
  );

  const handleRootDragOver = useCallback(
    (event: React.DragEvent) => {
      if (!canEdit) {
        return;
      }

      const item = dragging ?? readTreeDragItem(event.dataTransfer);
      if (!canDropOnRoot(item)) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDropTargetId(WORKSPACE_ROOT_DROP_ID);
    },
    [canDropOnRoot, canEdit, dragging],
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    const related = event.relatedTarget as Node | null;
    if (related && event.currentTarget.contains(related)) {
      return;
    }
    setDropTargetId(null);
  }, []);

  const performMove = useCallback(
    (targetFolderId: string | null) => {
      if (!dragging) {
        return;
      }

      startMove(async () => {
        if (dragging.type === "folder") {
          const result = await moveFolder({
            folderId: dragging.id,
            targetParentFolderId: targetFolderId,
          });
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Folder moved");
        } else {
          const result = await moveSheet({
            sheetId: dragging.id,
            targetFolderId,
          });
          if (!result.success) {
            toast.error(result.error);
            return;
          }
          toast.success("Sheet moved");
        }

        setDragging(null);
        setDropTargetId(null);
        onRefresh();
      });
    },
    [dragging, onRefresh],
  );

  const handleDropOnFolder = useCallback(
    (event: React.DragEvent, folderId: string) => {
      event.preventDefault();
      event.stopPropagation();
      const item = dragging ?? readTreeDragItem(event.dataTransfer);
      if (!canDropOnFolder(folderId, item)) {
        return;
      }

      performMove(folderId);
    },
    [canDropOnFolder, dragging, performMove],
  );

  const handleDropOnRoot = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const item = dragging ?? readTreeDragItem(event.dataTransfer);
      if (!canDropOnRoot(item)) {
        return;
      }

      performMove(null);
    },
    [canDropOnRoot, dragging, performMove],
  );

  return {
    dragging,
    dropTargetId,
    isMoving,
    canEdit,
    handleDragStart,
    handleDragEnd,
    handleFolderDragOver,
    handleRootDragOver,
    handleDragLeave,
    handleDropOnFolder,
    handleDropOnRoot,
    isFolderDropTarget: (folderId: string) => dropTargetId === folderId,
    isRootDropTarget: dropTargetId === WORKSPACE_ROOT_DROP_ID,
  };
}
