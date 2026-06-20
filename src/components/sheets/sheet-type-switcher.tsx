"use client";

import { useState, useTransition } from "react";
import type { ColumnType } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SheetGridController } from "./use-sheet-grid";

const COLUMN_TYPES: { value: ColumnType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "contact", label: "Contact" },
];

export function SheetTypeSwitcher({
  grid,
  column,
}: {
  grid: SheetGridController;
  column: ReturnType<SheetGridController["getActiveColumn"]>;
}) {
  const [pendingType, setPendingType] = useState<ColumnType | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!column || grid.readOnly) {
    return null;
  }

  const currentLabel = COLUMN_TYPES.find((entry) => entry.value === column.type)?.label ?? column.type;
  const preview = pendingType ? grid.previewTypeChange(column.id, pendingType) : null;

  function confirmTypeChange() {
    if (!pendingType || !column) {
      return;
    }

    startTransition(async () => {
      const success = await grid.changeColumnType(column.id, pendingType);
      if (success) {
        setPendingType(null);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs">
              {currentLabel}
            </Button>
          }
        />
        <DropdownMenuContent align="start" className="w-40">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Column type</DropdownMenuLabel>
            {COLUMN_TYPES.map((entry) => (
              <DropdownMenuItem
                key={entry.value}
                disabled={entry.value === column.type}
                onClick={() => setPendingType(entry.value)}
              >
                {entry.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={pendingType !== null} onOpenChange={(open) => !open && setPendingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change column type</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Change &quot;{column.label}&quot; to{" "}
            {COLUMN_TYPES.find((entry) => entry.value === pendingType)?.label ?? pendingType}. Loaded
            cells will be converted where possible.
          </p>
          {preview && preview.totalCells > 0 ? (
            <p className="text-sm">
              {preview.changedCells} of {preview.totalCells} loaded cells will change.
            </p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingType(null)}>
              Cancel
            </Button>
            <Button type="button" disabled={isPending} onClick={confirmTypeChange}>
              Change type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
