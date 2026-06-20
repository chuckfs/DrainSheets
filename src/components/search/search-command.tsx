"use client";

import { useEffect } from "react";
import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function SearchCommandTrigger({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    function handleSlash(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      onOpen();
    }

    window.addEventListener("keydown", handleSlash);
    return () => window.removeEventListener("keydown", handleSlash);
  }, [onOpen]);

  return (
    <Button
      type="button"
      variant="outline"
      className="h-8 w-full max-w-2xl justify-start gap-2 px-2.5 text-sm text-muted-foreground"
      aria-label="Open search"
      onClick={onOpen}
    >
      <SearchIcon className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">Search sheets, rows, contacts…</span>
      <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline">
        ⌘K
      </kbd>
    </Button>
  );
}
