"use client";

import { useState } from "react";
import { ColumnsIcon, PlusIcon, RowsIcon, Share2Icon } from "lucide-react";
import type { AccessContext } from "@/lib/access/effective-role";
import type { Sheet } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { SheetHeader } from "@/components/layout/sheet-header";
import { AccessBadge } from "@/components/shares/access-badge";
import { ShareDialog } from "@/components/shares/share-dialog";
import { AddColumnDialog } from "./add-column-dialog";
import type { SheetGridController } from "./use-sheet-grid";

export function SheetToolbar({
  sheet,
  grid,
  access,
}: {
  sheet: Sheet;
  grid: SheetGridController;
  access: AccessContext;
}) {
  const [addColumnOpen, setAddColumnOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const canEdit = access.canEdit && !grid.readOnly;

  return (
    <>
      <SheetHeader
        eyebrow="Sheet"
        title={sheet.name}
        subtitle={sheet.description ?? undefined}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <AccessBadge access={access} />
            <span className="inline-flex items-center gap-1">
              <RowsIcon className="size-3" />
              {grid.rows.length} {grid.rows.length === 1 ? "row" : "rows"}
            </span>
            <span className="inline-flex items-center gap-1">
              <ColumnsIcon className="size-3" />
              {grid.columns.length} {grid.columns.length === 1 ? "column" : "columns"}
            </span>
            {grid.readOnly && (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                View only
              </span>
            )}
          </div>
        }
        actions={
          <div className="flex items-center gap-1.5">
            {access.canShare && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => setShareOpen(true)}
              >
                <Share2Icon className="size-3.5" />
                Share
              </Button>
            )}
            {canEdit && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  disabled={grid.isAddingRow}
                  onClick={() => void grid.addRow()}
                >
                  <PlusIcon className="size-3.5" />
                  Add row
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setAddColumnOpen(true)}
                >
                  <ColumnsIcon className="size-3.5" />
                  Add column
                </Button>
              </>
            )}
          </div>
        }
      />

      <AddColumnDialog
        open={addColumnOpen}
        onOpenChange={setAddColumnOpen}
        onAdd={grid.addColumn}
      />

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        resourceType="sheet"
        resourceId={sheet.id}
        resourceName={sheet.name}
      />
    </>
  );
}
