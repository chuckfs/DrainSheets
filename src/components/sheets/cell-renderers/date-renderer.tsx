"use client";

import { cn } from "@/lib/utils";
import { CellInput } from "./cell-input";
import type { CellRendererProps } from "./types";
import { formatDisplayValue, valueToString } from "./utils";

export function DateRenderer(props: CellRendererProps) {
  const display = formatDisplayValue(props.column, props.value);

  if (props.mode === "display") {
    return (
      <span className={cn("block truncate tabular-nums", !display && "text-muted-foreground")}>
        {display || "—"}
      </span>
    );
  }

  return (
    <CellInput
      type="date"
      value={valueToString(props.value)}
      autoFocus={props.autoFocus}
      isSaving={props.isSaving}
      onCommit={(next) => props.onCommit(next.trim() || null)}
      onCancel={props.onCancel}
      onNavigate={props.onNavigate}
    />
  );
}
