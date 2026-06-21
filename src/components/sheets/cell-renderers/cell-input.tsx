"use client";

import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { NavigateDirection } from "./types";

type CellInputProps = {
  value: string;
  type?: React.HTMLInputTypeAttribute;
  multiline?: boolean;
  autoFocus?: boolean;
  isSaving?: boolean;
  className?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
  onNavigate?: (direction: NavigateDirection) => void;
};

const cellEditorClassName =
  "h-full min-h-[calc(theme(spacing.7)-2px)] w-full rounded-none border-0 bg-transparent px-2 py-1 text-[13px] shadow-none outline-none focus-visible:border-0 focus-visible:ring-0 focus-visible:outline-none dark:bg-transparent disabled:bg-transparent";

export function CellInput({
  value,
  type = "text",
  multiline = false,
  autoFocus = false,
  isSaving = false,
  className,
  onCommit,
  onCancel,
  onNavigate,
}: CellInputProps) {
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!autoFocus || !ref.current) {
      return;
    }

    ref.current.focus();
    if ("select" in ref.current) {
      ref.current.select();
    }
  }, [autoFocus]);

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }

    if (event.key === "Enter" && !multiline) {
      event.preventDefault();
      onCommit((event.target as HTMLInputElement).value);
      onNavigate?.("down");
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      onCommit((event.target as HTMLInputElement).value);
      onNavigate?.(event.shiftKey ? "prev" : "next");
    }
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const related = event.relatedTarget;
    const gridCell = event.currentTarget.closest('[role="gridcell"]');
    if (related instanceof Node && gridCell?.contains(related)) {
      return;
    }

    onCommit(event.currentTarget.value);
  }

  if (multiline) {
    return (
      <Textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        defaultValue={value}
        rows={2}
        disabled={isSaving}
        className={cn(cellEditorClassName, "resize-none", className)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    );
  }

  return (
    <Input
      ref={ref as React.RefObject<HTMLInputElement>}
      type={type}
      defaultValue={value}
      disabled={isSaving}
      className={cn(cellEditorClassName, className)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    />
  );
}
