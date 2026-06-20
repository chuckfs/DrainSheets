"use client";

import { createContext, useContext } from "react";
import type { SheetClipboardController } from "./use-sheet-clipboard";

const SheetClipboardContext = createContext<SheetClipboardController | null>(null);

export function SheetClipboardProvider({
  clipboard,
  children,
}: {
  clipboard: SheetClipboardController;
  children: React.ReactNode;
}) {
  return (
    <SheetClipboardContext.Provider value={clipboard}>{children}</SheetClipboardContext.Provider>
  );
}

export function useSheetClipboardActions() {
  const context = useContext(SheetClipboardContext);
  if (!context) {
    throw new Error("useSheetClipboardActions must be used within SheetClipboardProvider");
  }
  return context;
}
