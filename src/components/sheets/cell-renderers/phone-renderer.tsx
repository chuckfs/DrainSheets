"use client";

import { CellInput } from "./cell-input";
import type { CellRendererProps } from "./types";
import { formatDisplayValue, valueToString } from "./utils";

export function PhoneRenderer(props: CellRendererProps) {
  const display = formatDisplayValue(props.column, props.value);

  if (props.mode === "display") {
    if (!display) {
      return <span className="text-muted-foreground">—</span>;
    }

    return (
      <a
        href={`tel:${display}`}
        className="block truncate text-primary underline-offset-2 hover:underline"
        onClick={(event) => event.stopPropagation()}
      >
        {display}
      </a>
    );
  }

  return (
    <CellInput
      type="tel"
      value={valueToString(props.value)}
      autoFocus={props.autoFocus}
      isSaving={props.isSaving}
      onCommit={(next) => props.onCommit(next.trim() || null)}
      onCancel={props.onCancel}
      onNavigate={props.onNavigate}
    />
  );
}
