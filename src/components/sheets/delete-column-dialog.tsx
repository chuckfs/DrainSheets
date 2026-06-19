"use client";

import { useTransition } from "react";
import type { SheetColumn } from "@/types/domain";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SheetGridController } from "./use-sheet-grid";

export function DeleteColumnDialog({
  column,
  open,
  onOpenChange,
  grid,
}: {
  column: SheetColumn | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grid: SheetGridController;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!column) {
      return;
    }

    startTransition(async () => {
      const ok = await grid.deleteColumnById(column.id);
      if (ok) {
        onOpenChange(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete column</DialogTitle>
          <DialogDescription>
            Delete “{column?.label}”? Values in this column will be removed from all rows. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
            Delete column
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
