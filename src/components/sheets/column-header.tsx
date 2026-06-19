"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PinIcon, Settings2Icon, Trash2Icon } from "lucide-react";
import type { ColumnLayout } from "@/lib/sheets/column-widths";
import type { SheetColumn } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ColumnResizeHandle } from "./column-resize-handle";
import { SelectOptionsEditor } from "./select-options-editor";
import { DeleteColumnDialog } from "./delete-column-dialog";
import type { SheetGridController } from "./use-sheet-grid";

export function ColumnHeader({
  column,
  columnIndex,
  columnCount,
  layout,
  grid,
}: {
  column: SheetColumn;
  columnIndex: number;
  columnCount: number;
  layout: ColumnLayout;
  grid: SheetGridController;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(column.label);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isMoving, startMove] = useTransition();
  const widthRef = useRef(layout.widthPx);

  useEffect(() => {
    setDraftLabel(column.label);
  }, [column.label]);

  useEffect(() => {
    widthRef.current = layout.widthPx;
  }, [layout.widthPx]);

  const isReadOnly = grid.readOnly;

  function saveLabel() {
    if (isReadOnly) {
      return;
    }

    const trimmed = draftLabel.trim();
    setIsEditing(false);

    if (!trimmed || trimmed === column.label) {
      setDraftLabel(column.label);
      return;
    }

    void grid.renameColumn(column.id, trimmed);
  }

  return (
    <>
      <div className="group relative flex min-w-0 items-center gap-1 pr-2">
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
              column.is_pinned && "text-foreground",
            )}
            onDoubleClick={() => {
              if (!isReadOnly) {
                setIsEditing(true);
              }
            }}
            title={isReadOnly ? column.label : "Double-click to rename"}
          >
            {column.is_pinned && <PinIcon className="mr-1 inline size-3" aria-hidden />}
            {column.label}
          </button>
        )}

        <div className={cn("flex shrink-0", !isReadOnly && "opacity-0 transition-opacity group-hover:opacity-100")}>
          {!isReadOnly && column.type === "select" && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6"
              onClick={() => setOptionsOpen(true)}
              aria-label="Edit select options"
            >
              <Settings2Icon className="size-3" />
            </Button>
          )}
          {!isReadOnly && (
            <>
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
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-6"
            onClick={() => void grid.toggleColumnPinned(column.id, !column.is_pinned)}
            aria-label={column.is_pinned ? "Unpin column" : "Pin column"}
            title={column.is_pinned ? "Unpin" : "Pin column"}
          >
            <PinIcon className={cn("size-3", column.is_pinned && "text-primary")} />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-6 text-destructive"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete column"
          >
            <Trash2Icon className="size-3" />
          </Button>
            </>
          )}
        </div>

        {!isReadOnly && (
        <ColumnResizeHandle
          onResize={(delta) => {
            const next = Math.max(60, widthRef.current + delta);
            widthRef.current = next;
            grid.resizeColumn(column.id, next);
          }}
          onResizeEnd={() => {
            void grid.persistColumnWidth(column.id, widthRef.current);
          }}
        />
        )}
      </div>

      {column.type === "select" && !isReadOnly && (
        <SelectOptionsEditor
          column={column}
          open={optionsOpen}
          onOpenChange={setOptionsOpen}
          onSave={(options) => grid.saveSelectOptions(column.id, options)}
        />
      )}

      {!isReadOnly && (
        <DeleteColumnDialog
          column={column}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          grid={grid}
        />
      )}
    </>
  );
}
