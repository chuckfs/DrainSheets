"use client";

import { useEffect, useRef } from "react";
import { isGridEditableTarget, resolveGridKeyboardShortcut } from "@/lib/sheets/grid-keyboard";
import type { SheetGridController } from "./use-sheet-grid";

function isPrintableKey(key: string): boolean {
  return key.length === 1 && !key.match(/[\x00-\x1F]/);
}

export function useSheetKeyboard(
  grid: SheetGridController,
  clipboardHandler: (event: KeyboardEvent) => void,
) {
  const escapeArmedRef = useRef(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (grid.readOnly) {
        return;
      }

      if (isGridEditableTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        if (grid.editingCell) {
          grid.stopEditing();
          escapeArmedRef.current = true;
          event.preventDefault();
          return;
        }

        if (escapeArmedRef.current || grid.selectedCell || grid.selectionRange) {
          grid.clearSelection();
          escapeArmedRef.current = false;
          event.preventDefault();
          return;
        }
      } else {
        escapeArmedRef.current = false;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && !grid.editingCell) {
        if (grid.selectionRange || grid.selectedCell) {
          event.preventDefault();
          void grid.clearSelectionValues();
          return;
        }
      }

      if (isPrintableKey(event.key) && grid.selectedCell && !grid.editingCell && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        grid.startEditing(grid.selectedCell);
        return;
      }

      const shortcut = resolveGridKeyboardShortcut(event);
      if (!shortcut) {
        return;
      }

      if (shortcut === "undo") {
        event.preventDefault();
        void grid.undo();
        return;
      }

      if (shortcut === "redo") {
        event.preventDefault();
        void grid.redo();
        return;
      }

      if (shortcut === "fill_down") {
        event.preventDefault();
        void grid.fillDown();
        return;
      }

      if (shortcut === "bold") {
        event.preventDefault();
        void grid.toggleFormatting("bold");
        return;
      }

      if (shortcut === "italic") {
        event.preventDefault();
        void grid.toggleFormatting("italic");
        return;
      }

      if (shortcut === "underline") {
        event.preventDefault();
        void grid.toggleFormatting("underline");
        return;
      }

      clipboardHandler(event);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clipboardHandler, grid]);
}
