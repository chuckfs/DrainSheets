"use client";

import { useEffect } from "react";
import { isGridEditableTarget, resolveGridKeyboardShortcut } from "@/lib/sheets/grid-keyboard";
import type { SheetGridController } from "./use-sheet-grid";

export function useSheetKeyboard(
  grid: SheetGridController,
  clipboardHandler: (event: KeyboardEvent) => void,
) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (grid.readOnly || isGridEditableTarget(event.target)) {
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

      clipboardHandler(event);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clipboardHandler, grid]);
}
