"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { SheetColumn } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SheetGridController } from "./use-sheet-grid";

export function ColumnHeader({
  column,
  columnIndex,
  columnCount,
  grid,
}: {
  column: SheetColumn;
  columnIndex: number;
  columnCount: number;
  grid: SheetGridController;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(column.label);
  const [isMoving, startMove] = useTransition();

  useEffect(() => {
    setDraftLabel(column.label);
  }, [column.label]);

  function saveLabel() {
    const trimmed = draftLabel.trim();
    setIsEditing(false);

    if (!trimmed || trimmed === column.label) {
      setDraftLabel(column.label);
      return;
    }

    void grid.renameColumn(column.id, trimmed);
  }

  return (
    <div className="group flex min-w-[120px] items-center gap-1">
      {isEditing ? (
        <Input
          value={draftLabel}
          autoFocus
          className="h-6 px-1 text-xs uppercase"
          onChange={(event) => setDraftLabel(event.target.value)}
          onBlur={saveLabel}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              saveLabel();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDraftLabel(column.label);
              setIsEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          className={cn(
            "min-w-0 flex-1 truncate text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
            "hover:text-foreground",
          )}
          onDoubleClick={() => setIsEditing(true)}
          title="Double-click to rename"
        >
          {column.label}
        </button>
      )}

      <div className="flex shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-6"
          disabled={isMoving || columnIndex === 0}
          onClick={() => startMove(() => void grid.reorderColumn(column.id, "left"))}
          aria-label="Move column left"
        >
          <ChevronLeftIcon className="size-3" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-6"
          disabled={isMoving || columnIndex >= columnCount - 1}
          onClick={() => startMove(() => void grid.reorderColumn(column.id, "right"))}
          aria-label="Move column right"
        >
          <ChevronRightIcon className="size-3" />
        </Button>
      </div>
    </div>
  );
}
