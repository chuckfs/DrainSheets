"use client";

import { cn } from "@/lib/utils";
import { CellInput } from "./cell-input";
import type { CellRendererProps } from "./types";
import { formatDisplayValue, valueToString } from "./utils";

export function EmailRenderer(props: CellRendererProps) {
  const display = formatDisplayValue(props.column, props.value);

  if (props.mode === "display") {
    if (!display) {
      return <span className="text-muted-foreground">—</span>;
    }

    return (
      <a
        href={`mailto:${display}`}
        className="block truncate text-primary underline-offset-2 hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        {display}
      </a>
    );
  }

  return (
    <CellInput
      type="email"
      value={valueToString(props.value)}
      autoFocus={props.autoFocus}
      isSaving={props.isSaving}
      onCommit={(next) => props.onCommit(next.trim() || null)}
      onCancel={props.onCancel}
      onNavigate={props.onNavigate}
    />
  );
}
