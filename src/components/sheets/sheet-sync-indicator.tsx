"use client";

import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SheetSyncState } from "./use-sheet-sync";

export function SheetSyncIndicator({ syncState }: { syncState: SheetSyncState }) {
  if (syncState === "idle") {
    return null;
  }

  const label =
    syncState === "saving"
      ? "Saving…"
      : syncState === "saved"
        ? "All changes saved"
        : "Save failed";

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs",
        syncState === "error" ? "text-destructive" : "text-muted-foreground",
      )}
      aria-live="polite"
    >
      {syncState === "saving" ? <Loader2Icon className="size-3 animate-spin" aria-hidden /> : null}
      {label}
    </span>
  );
}
