"use client";

import { cn } from "@/lib/utils";
import { CellInput } from "./cell-input";
import type { CellRendererProps } from "./types";
import { formatDisplayValue, valueToString } from "./utils";

export function TextRenderer({
  column,
  value,
  mode,
  autoFocus,
  isSaving,
  onCommit,
  onCancel,
  onNavigate,
}: CellRendererProps) {
  const display = formatDisplayValue(column, value);

  if (mode === "display") {
    return (
      <span className={cn("block truncate", !display && "text-muted-foreground")}>
        {display || "—"}
      </span>
    );
  }

  return (
    <CellInput
      value={valueToString(value)}
      autoFocus={autoFocus}
      isSaving={isSaving}
      onCommit={(next) => onCommit(next.trim() || null)}
      onCancel={onCancel}
      onNavigate={onNavigate}
    />
  );
}
