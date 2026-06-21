"use client";

import { useState, useTransition } from "react";
import type { ColumnType, SheetColumn } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { SheetGridController } from "./use-sheet-grid";

export const COLUMN_TYPE_OPTIONS: { value: ColumnType; label: string; description: string }[] = [
  { value: "text", label: "Text", description: "General text — default for most columns" },
  { value: "long_text", label: "Long text", description: "Multi-line notes and comments" },
  { value: "number", label: "Number", description: "Numeric values with optional decimals" },
  { value: "currency", label: "Currency", description: "Money with currency formatting" },
  { value: "date", label: "Date", description: "Calendar dates" },
  { value: "url", label: "URL", description: "Clickable links" },
  { value: "email", label: "Email", description: "Email addresses" },
  { value: "phone", label: "Phone", description: "Phone numbers" },
  { value: "select", label: "Select", description: "Dropdown with preset options" },
  { value: "checkbox", label: "Checkbox", description: "True / false toggle" },
  { value: "contact", label: "Contact", description: "Link to a CRM contact" },
];

export function columnTypeLabel(type: ColumnType): string {
  return COLUMN_TYPE_OPTIONS.find((entry) => entry.value === type)?.label ?? type;
}

export function ColumnTypeChangeDialog({
  open,
  onOpenChange,
  column,
  grid,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column: SheetColumn;
  grid: SheetGridController;
}) {
  const [pendingType, setPendingType] = useState<ColumnType | null>(null);
  const [isPending, startTransition] = useTransition();

  const preview = pendingType ? grid.previewTypeChange(column.id, pendingType) : null;

  function closeDialog() {
    setPendingType(null);
    onOpenChange(false);
  }

  function confirmTypeChange() {
    if (!pendingType) {
      return;
    }

    startTransition(async () => {
      const success = await grid.changeColumnType(column.id, pendingType);
      if (success) {
        closeDialog();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setPendingType(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        {pendingType ? (
          <>
            <DialogHeader>
              <DialogTitle>Change column type</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Change &quot;{column.label}&quot; from {columnTypeLabel(column.type)} to{" "}
              {columnTypeLabel(pendingType)}. Loaded cells will be converted where possible.
            </p>
            {preview && preview.totalCells > 0 ? (
              <p className="text-sm">
                {preview.changedCells} of {preview.totalCells} loaded cells will change.
              </p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPendingType(null)} disabled={isPending}>
                Back
              </Button>
              <Button type="button" disabled={isPending} onClick={confirmTypeChange}>
                {isPending ? "Changing…" : "Change type"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Column type</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Columns default to text — change the type only when you need special behavior like dropdowns,
              checkboxes, or contacts.
            </p>
            <ul className="max-h-72 space-y-1 overflow-auto">
              {COLUMN_TYPE_OPTIONS.map((entry) => {
                const active = entry.value === column.type;

                return (
                  <li key={entry.value}>
                    <button
                      type="button"
                      disabled={active || isPending}
                      className={cn(
                        "w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-muted disabled:cursor-default disabled:opacity-60",
                        active && "bg-muted",
                      )}
                      onClick={() => setPendingType(entry.value)}
                    >
                      <div className="text-sm font-medium">
                        {entry.label}
                        {active ? " (current)" : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">{entry.description}</div>
                    </button>
                  </li>
                );
              })}
            </ul>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
