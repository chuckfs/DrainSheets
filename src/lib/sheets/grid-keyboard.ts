export type GridKeyboardShortcut =
  | "undo"
  | "redo"
  | "fill_down"
  | "copy"
  | "cut"
  | "paste";

export function resolveGridKeyboardShortcut(input: {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
}): GridKeyboardShortcut | null {
  const mod = input.metaKey || input.ctrlKey;
  if (!mod) {
    return null;
  }

  const key = input.key.toLowerCase();

  if (key === "z") {
    return input.shiftKey ? "redo" : "undo";
  }

  if (key === "d") {
    return "fill_down";
  }

  if (key === "c") {
    return "copy";
  }

  if (key === "x") {
    return "cut";
  }

  if (key === "v") {
    return "paste";
  }

  return null;
}

export function isGridEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") {
    return false;
  }

  const element = target as HTMLElement;

  if ("isContentEditable" in element && element.isContentEditable) {
    return true;
  }

  const tag = "tagName" in element ? element.tagName : "";
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
