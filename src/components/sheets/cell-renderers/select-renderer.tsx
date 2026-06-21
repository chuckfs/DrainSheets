"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { CellRendererProps } from "./types";
import { formatDisplayValue, getSelectOptions, valueToString } from "./utils";

export function SelectRenderer({
  column,
  value,
  mode,
  autoFocus,
  isSaving,
  onCommit,
  onCancel,
  onNavigate,
}: CellRendererProps) {
  const ref = useRef<HTMLSelectElement>(null);
  const options = getSelectOptions(column);
  const display = formatDisplayValue(column, value);
  const current = valueToString(value);

  useEffect(() => {
    if (mode === "edit" && autoFocus) {
      ref.current?.focus();
    }
  }, [autoFocus, mode]);

  if (mode === "display") {
    const matched = options.find((option) => option.value === current);
    return (
      <span className={cn("block truncate", !display && "text-muted-foreground")}>
        {matched?.color ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: matched.color }}
              aria-hidden
            />
            {display || "—"}
          </span>
        ) : (
          display || "—"
        )}
      </span>
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLSelectElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      onCommit(event.currentTarget.value || null);
      onNavigate?.("down");
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      onCommit(event.currentTarget.value || null);
      onNavigate?.(event.shiftKey ? "prev" : "next");
    }
  }

  return (
    <select
      ref={ref}
      defaultValue={current}
      disabled={isSaving}
      className="h-full min-h-[calc(theme(spacing.7)-2px)] w-full min-w-0 rounded-none border-0 bg-transparent px-2 py-1 text-[13px] outline-none focus:ring-0 disabled:opacity-50"
      onKeyDown={handleKeyDown}
      onBlur={(event) => onCommit(event.currentTarget.value || null)}
      onChange={(event) => onCommit(event.currentTarget.value || null)}
    >
      <option value="">—</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
