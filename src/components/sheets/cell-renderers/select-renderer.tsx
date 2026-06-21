"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { APP_SELECT_EMPTY, resolveAppSelectLabel } from "@/components/ui/app-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const options = getSelectOptions(column);
  const display = formatDisplayValue(column, value);
  const current = valueToString(value);
  const internalValue = current === "" ? APP_SELECT_EMPTY : current;
  const emptyOption = { value: "", label: "—" };
  const selectOptions = [
    emptyOption,
    ...options.map((option) => ({ value: option.value, label: option.label })),
  ];
  const displayLabel = resolveAppSelectLabel(current, selectOptions, "—");

  useEffect(() => {
    if (mode === "edit" && autoFocus) {
      triggerRef.current?.focus();
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

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      onNavigate?.("down");
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      onNavigate?.(event.shiftKey ? "prev" : "next");
    }
  }

  function handleValueChange(next: string | null | undefined) {
    if (next === null || next === undefined) {
      return;
    }
    onCommit(next === APP_SELECT_EMPTY ? null : next);
  }

  return (
    <Select
      value={internalValue}
      disabled={isSaving}
      onValueChange={handleValueChange}
    >
      <SelectTrigger
        ref={triggerRef}
        size="sm"
        className="h-full min-h-[calc(theme(spacing.7)-2px)] w-full min-w-0 rounded-none border-0 bg-transparent px-2 py-1 text-[13px] shadow-none focus-visible:border-0 focus-visible:ring-0 disabled:opacity-50"
        onKeyDown={handleKeyDown}
      >
        <span className="block truncate">{displayLabel || "—"}</span>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectItem value={APP_SELECT_EMPTY}>—</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
