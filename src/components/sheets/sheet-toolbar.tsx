"use client";

import { useState, type ReactNode } from "react";
import { ColumnsIcon, LayoutTemplateIcon, RowsIcon, Share2Icon } from "lucide-react";
import type { AccessContext } from "@/lib/access/effective-role";
import type { Sheet } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { SheetHeader } from "@/components/layout/sheet-header";
import { AccessBadge } from "@/components/shares/access-badge";
import { ShareDialog } from "@/components/shares/share-dialog";
import type { SheetTemplateProvenance } from "@/actions/templates";
import { SheetTemplateProvenance as SheetTemplateProvenanceBadge } from "@/components/sheets/sheet-template-provenance";
import { SaveAsTemplateDialog } from "@/components/sheets/save-as-template-dialog";
import type { SheetGridController } from "./use-sheet-grid";

export function SheetToolbar({
  sheet,
  grid,
  access,
  templateProvenance,
  collaborationToggle,
}: {
  sheet: Sheet;
  grid: SheetGridController;
  access: AccessContext;
  templateProvenance: SheetTemplateProvenance;
  collaborationToggle?: ReactNode;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);

  return (
    <>
      <SheetHeader
        eyebrow="Sheet"
        title={sheet.name}
        subtitle={sheet.description ?? undefined}
        meta={
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <AccessBadge access={access} />
            <SheetTemplateProvenanceBadge provenance={templateProvenance} />
            <span className="inline-flex items-center gap-1">
              <RowsIcon className="size-3" />
              {grid.totalRowCount} {grid.totalRowCount === 1 ? "row" : "rows"}
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
            {collaborationToggle}
            {access.canEdit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => setSaveTemplateOpen(true)}
              >
                <LayoutTemplateIcon className="size-3.5" />
                Save as template
              </Button>
            )}
            {access.canShare && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => setShareOpen(true)}
                aria-label="Share sheet"
              >
                <Share2Icon className="size-3.5" />
                Share
              </Button>
            )}
          </div>
        }
      />

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        resourceType="sheet"
        resourceId={sheet.id}
        resourceName={sheet.name}
      />

      <SaveAsTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        sheetId={sheet.id}
        defaultName={sheet.name}
      />
    </>
  );
}
