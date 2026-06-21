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
import { ColumnTypeChangeDialog } from "./column-type-change-dialog";
import { GridContextMenu } from "./grid-context-menu";
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
  const [draftLabel, setDraftLabel] = useState(column.label);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [isMoving, startMove] = useTransition();
  const widthRef = useRef(layout.widthPx);
  const inputRef = useRef<HTMLInputElement>(null);

  const isReadOnly = grid.readOnly;
  const isEditing = grid.editingColumnId === column.id;

  useEffect(() => {
    if (!isEditing) {
      setDraftLabel(column.label);
    }
  }, [column.label, isEditing]);

  useEffect(() => {
    widthRef.current = layout.widthPx;
  }, [layout.widthPx]);

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    setDraftLabel(column.label);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, [column.label, isEditing]);

  function cancelEditing() {
    setDraftLabel(column.label);
    grid.stopEditingColumnLabel();
  }

  function saveLabel() {
    if (isReadOnly) {
      return;
    }

    const trimmed = draftLabel.trim();
    grid.stopEditingColumnLabel();

    if (!trimmed || trimmed === column.label) {
      setDraftLabel(column.label);
      return;
    }

    void grid.renameColumn(column.id, trimmed);
  }

  function beginEditing() {
    if (isReadOnly || isEditing) {
      return;
    }

    grid.startEditingColumnLabel(column.id);
  }

  return (
    <>
      <GridContextMenu
        items={[
          {
            id: "rename",
            label: "Rename column",
            onSelect: beginEditing,
            disabled: isReadOnly,
          },
          {
            id: "pin",
            label: column.is_pinned ? "Unpin column" : "Pin column",
            onSelect: () => void grid.toggleColumnPinned(column.id, !column.is_pinned),
            disabled: isReadOnly,
          },
          {
            id: "type",
            label: "Change column type…",
            onSelect: () => setTypeDialogOpen(true),
            disabled: isReadOnly,
            separatorBefore: true,
          },
          {
            id: "hide",
            label: "Hide column",
            onSelect: () => void grid.hideColumnById(column.id),
            disabled: isReadOnly,
          },
          {
            id: "unhide-all",
            label: "Unhide all columns",
            onSelect: () => void grid.unhideAllColumns(),
            disabled: isReadOnly,
          },
          {
            id: "add",
            label: "Insert column right",
            onSelect: () => void grid.addColumn("Column", "text"),
            disabled: isReadOnly,
            separatorBefore: true,
          },
          {
            id: "delete",
            label: "Delete column",
            onSelect: () => setDeleteOpen(true),
            disabled: isReadOnly,
            destructive: true,
          },
        ]}
      >
      <div className="group relative flex min-w-0 items-center gap-1 pr-2">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={draftLabel}
            className="h-6 min-w-0 flex-1 px-1 text-xs uppercase"
            onChange={(event) => setDraftLabel(event.target.value)}
            onBlur={saveLabel}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                saveLabel();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                cancelEditing();
              }
            }}
          />
        ) : (
          <div
            role="presentation"
            className={cn(
              "min-w-0 flex-1 cursor-default truncate text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
              "hover:text-foreground",
              column.is_pinned && "text-foreground",
            )}
            onDoubleClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              beginEditing();
            }}
            title={isReadOnly ? column.label : "Double-click to rename"}
          >
            {column.is_pinned && <PinIcon className="mr-1 inline size-3" aria-hidden />}
            {column.label}
          </div>
        )}

        {!isEditing && (
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
        )}

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
      </GridContextMenu>

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

      {!isReadOnly && (
        <ColumnTypeChangeDialog
          open={typeDialogOpen}
          onOpenChange={setTypeDialogOpen}
          column={column}
          grid={grid}
        />
      )}
    </>
  );
}
