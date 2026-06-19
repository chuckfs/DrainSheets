"use client";

import { cn } from "@/lib/utils";
import { CellInput } from "./cell-input";
import type { CellRendererProps } from "./types";
import { formatDisplayValue, valueToString } from "./utils";

export function LongTextRenderer(props: CellRendererProps) {
  const display = formatDisplayValue(props.column, props.value);

  if (props.mode === "display") {
    return (
      <span className={cn("block line-clamp-2 whitespace-pre-wrap", !display && "text-muted-foreground")}>
        {display || "—"}
      </span>
    );
  }

  return (
    <CellInput
      multiline
      value={valueToString(props.value)}
      autoFocus={props.autoFocus}
      isSaving={props.isSaving}
      onCommit={(next) => props.onCommit(next.trim() || null)}
      onCancel={props.onCancel}
      onNavigate={props.onNavigate}
    />
  );
}
