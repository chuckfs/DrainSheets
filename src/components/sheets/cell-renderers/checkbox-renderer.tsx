"use client";

import { cn } from "@/lib/utils";
import type { CellRendererProps } from "./types";
import { parseBooleanValue } from "./utils";

export function CheckboxRenderer({ value, mode, isSaving, onCommit }: CellRendererProps) {
  const checked = parseBooleanValue(value);

  return (
    <div className={cn("flex h-7 items-center justify-center", mode === "display" && "cursor-default")}>
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={checked}
        disabled={isSaving}
        onChange={(event) => onCommit(event.target.checked)}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
