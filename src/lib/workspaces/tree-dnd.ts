export const WORKSPACE_ROOT_DROP_ID = "__workspace_root__";

export type TreeDragItem =
  | { type: "folder"; id: string }
  | { type: "sheet"; id: string };

export const TREE_DRAG_MIME = "application/x-drainsheets-tree-item";

export function setTreeDragItem(dataTransfer: DataTransfer, item: TreeDragItem) {
  dataTransfer.setData(TREE_DRAG_MIME, JSON.stringify(item));
  dataTransfer.effectAllowed = "move";
}

export function readTreeDragItem(dataTransfer: DataTransfer): TreeDragItem | null {
  const raw = dataTransfer.getData(TREE_DRAG_MIME);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as TreeDragItem;
    if (parsed.type === "folder" || parsed.type === "sheet") {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export function isInteractiveDragTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") {
    return false;
  }

  const element = target as HTMLElement;
  return Boolean(
    element.closest("button, a, input, textarea, select, [role='menu'], [data-no-tree-drag]"),
  );
}
