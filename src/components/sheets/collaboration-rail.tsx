"use client";

import { useCallback, useEffect, useState } from "react";
import { ActivityIcon, FileIcon, MessageSquareIcon } from "lucide-react";
import type { AccessContext } from "@/lib/access/effective-role";
import { cn } from "@/lib/utils";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { AttachmentsPanel } from "@/components/documents/attachments-panel";
import { NotesPanel } from "@/components/notes/notes-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const MIN_RAIL_WIDTH = 280;
const MAX_RAIL_WIDTH = 520;
const DEFAULT_RAIL_WIDTH = 340;

export function CollaborationRail({
  sheetId,
  access,
  currentUserId,
  mobileOpen,
  onMobileOpenChange,
}: {
  sheetId: string;
  access: AccessContext;
  currentUserId: string;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const [width, setWidth] = useState(DEFAULT_RAIL_WIDTH);
  const [tab, setTab] = useState<"notes" | "attachments" | "activity">("notes");

  const startResize = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;

      function onMove(moveEvent: MouseEvent) {
        const delta = startX - moveEvent.clientX;
        const next = Math.min(MAX_RAIL_WIDTH, Math.max(MIN_RAIL_WIDTH, startWidth + delta));
        setWidth(next);
      }

      function onUp() {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [width],
  );

  const panel = (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as typeof tab)}
      className="flex h-full min-h-0 flex-col"
    >
      <TabsList variant="line" className="w-full shrink-0 justify-start px-2">
        <TabsTrigger value="notes" className="gap-1.5">
          <MessageSquareIcon className="size-3.5" />
          Notes
        </TabsTrigger>
        <TabsTrigger value="attachments" className="gap-1.5">
          <FileIcon className="size-3.5" />
          Attachments
        </TabsTrigger>
        <TabsTrigger value="activity" className="gap-1.5">
          <ActivityIcon className="size-3.5" />
          Activity
        </TabsTrigger>
      </TabsList>
      <TabsContent value="notes" className="flex min-h-0 flex-1 flex-col">
        <NotesPanel sheetId={sheetId} access={access} currentUserId={currentUserId} />
      </TabsContent>
      <TabsContent value="attachments" className="flex min-h-0 flex-1 flex-col">
        <AttachmentsPanel sheetId={sheetId} access={access} currentUserId={currentUserId} />
      </TabsContent>
      <TabsContent value="activity" className="flex min-h-0 flex-1 flex-col">
        <ActivityFeed sheetId={sheetId} />
      </TabsContent>
    </Tabs>
  );

  return (
    <>
      <aside
        className={cn("relative hidden min-h-0 shrink-0 border-l bg-background lg:flex lg:flex-col")}
        style={{ width }}
      >
        <div
          className="absolute top-0 left-0 z-10 h-full w-1.5 cursor-col-resize after:absolute after:inset-y-0 after:left-0 after:w-[2px] after:bg-primary after:opacity-0 after:transition-opacity hover:after:opacity-100"
          onMouseDown={startResize}
          aria-hidden
        />
        <div className="border-b px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Collaboration
        </div>
        <div className="min-h-0 flex-1">{panel}</div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>Collaboration</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1">{panel}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function CollaborationRailToggle({
  onOpen,
}: {
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex min-h-10 items-center gap-1 rounded-md border px-3 py-2 text-xs font-medium lg:hidden"
      aria-label="Open collaboration panel"
      onClick={onOpen}
    >
      <MessageSquareIcon className="size-3.5" />
      Collaboration
    </button>
  );
}

export function useCollaborationRail() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return { mobileOpen, setMobileOpen };
}

export function useRowDrawerSync(initialRowId: string | null) {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(initialRowId);

  useEffect(() => {
    setSelectedRowId(initialRowId);
  }, [initialRowId]);

  return { selectedRowId, setSelectedRowId };
}
