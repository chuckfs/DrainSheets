"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AccessContext } from "@/lib/access/effective-role";
import { NotesComposer, NotesList, useNotesLoader } from "./notes-list";

function ScopedNotes({
  sheetId,
  rowId,
  access,
  currentUserId,
}: {
  sheetId: string;
  rowId: string | null;
  access: AccessContext;
  currentUserId: string;
}) {
  const { notes, loading, reload } = useNotesLoader(sheetId, rowId);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading notes…</p>
          ) : (
            <NotesList
              notes={notes}
              access={access}
              currentUserId={currentUserId}
              onNotesChange={reload}
            />
          )}
        </div>
      </ScrollArea>
      <div className="shrink-0 border-t p-3">
        <NotesComposer sheetId={sheetId} rowId={rowId} access={access} onCreated={reload} />
      </div>
    </div>
  );
}

export function NotesPanel({
  sheetId,
  access,
  currentUserId,
  rowId,
  showScopeTabs = false,
}: {
  sheetId: string;
  access: AccessContext;
  currentUserId: string;
  rowId?: string | null;
  showScopeTabs?: boolean;
}) {
  const [scope, setScope] = useState<"sheet" | "row">("sheet");

  if (showScopeTabs && rowId) {
    return (
      <Tabs
        value={scope}
        onValueChange={(value) => setScope(value as "sheet" | "row")}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList variant="line" className="w-full shrink-0 justify-start px-1">
          <TabsTrigger value="sheet">Sheet Notes</TabsTrigger>
          <TabsTrigger value="row">Row Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="sheet" className="flex min-h-0 flex-1 flex-col">
          <ScopedNotes sheetId={sheetId} rowId={null} access={access} currentUserId={currentUserId} />
        </TabsContent>
        <TabsContent value="row" className="flex min-h-0 flex-1 flex-col">
          <ScopedNotes sheetId={sheetId} rowId={rowId} access={access} currentUserId={currentUserId} />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <ScopedNotes
      sheetId={sheetId}
      rowId={rowId ?? null}
      access={access}
      currentUserId={currentUserId}
    />
  );
}
