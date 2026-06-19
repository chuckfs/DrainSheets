"use client";

import { useMemo, useState } from "react";
import { MailIcon } from "lucide-react";
import type { Json } from "@/types/database";
import type { Row, SheetColumn } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AccessContext } from "@/lib/access/effective-role";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { AttachmentsPanel } from "@/components/documents/attachments-panel";
import { NotesPanel } from "@/components/notes/notes-panel";
import { SendUpdateDialog } from "@/components/email/send-update-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function formatCellValue(value: Json | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

export function RowDetailDrawer({
  open,
  onOpenChange,
  sheetId,
  row,
  columns,
  access,
  currentUserId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sheetId: string;
  row: Row | null;
  columns: SheetColumn[];
  access: AccessContext;
  currentUserId: string;
}) {
  const rowData = useMemo(() => {
    if (!row?.data || typeof row.data !== "object" || Array.isArray(row.data)) {
      return {} as Record<string, Json | undefined>;
    }
    return row.data as Record<string, Json | undefined>;
  }, [row]);

  const [sendOpen, setSendOpen] = useState(false);

  const primaryColumn = columns.find((column) => column.is_primary);
  const title =
    (primaryColumn ? formatCellValue(rowData[primaryColumn.key]) : null) ??
    `Row ${row ? row.position + 1 : ""}`;
  const canSendUpdate = row !== null && access.effectiveRole !== null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="truncate">{title}</SheetTitle>
            {canSendUpdate && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={() => setSendOpen(true)}
              >
                <MailIcon className="size-3.5" />
                Send update
              </Button>
            )}
          </div>
        </SheetHeader>

        {row && (
          <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col">
            <TabsList variant="line" className="w-full shrink-0 justify-start px-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-3 p-4">
                  {columns.map((column) => (
                    <div key={column.id} className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{column.label}</Label>
                      <p className="text-sm">{formatCellValue(rowData[column.key])}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="notes" className="flex min-h-0 flex-1 flex-col">
              <NotesPanel
                sheetId={sheetId}
                rowId={row.id}
                access={access}
                currentUserId={currentUserId}
                showScopeTabs
              />
            </TabsContent>

            <TabsContent value="attachments" className="flex min-h-0 flex-1 flex-col">
              <AttachmentsPanel
                sheetId={sheetId}
                rowId={row.id}
                access={access}
                currentUserId={currentUserId}
                showScopeTabs={false}
              />
            </TabsContent>

            <TabsContent value="activity" className="flex min-h-0 flex-1 flex-col">
              <ActivityFeed sheetId={sheetId} rowId={row.id} />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>

      {row && (
        <SendUpdateDialog
          open={sendOpen}
          onOpenChange={setSendOpen}
          sheetId={sheetId}
          rowId={row.id}
          rowLabel={title}
          columns={columns}
          rowData={rowData}
        />
      )}
    </Sheet>
  );
}
