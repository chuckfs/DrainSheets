"use client";

import { useEffect } from "react";
import type { SheetGridController } from "./use-sheet-grid";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable) {
    return true;
  }

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function useSheetKeyboard(
  grid: SheetGridController,
  clipboardHandler: (event: KeyboardEvent) => void,
) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (grid.readOnly || isEditableTarget(event.target)) {
        return;
      }

      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          void grid.redo();
        } else {
          void grid.undo();
        }
        return;
      }

      if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault();
        void grid.fillDown();
        return;
      }

      clipboardHandler(event);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clipboardHandler, grid]);
}
