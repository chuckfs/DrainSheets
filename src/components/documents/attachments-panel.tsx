"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentScope } from "@/actions/documents";
import type { AccessContext } from "@/lib/access/effective-role";
import { DocumentList, useDocumentsLoader } from "./document-list";
import { UploadDropzone } from "./upload-dropzone";

function ScopedAttachments({
  sheetId,
  scope,
  rowId,
  access,
  currentUserId,
}: {
  sheetId: string;
  scope: DocumentScope;
  rowId?: string | null;
  access: AccessContext;
  currentUserId: string;
}) {
  const { documents, loading, loadingMore, hasMore, reload, loadMore } = useDocumentsLoader(
    sheetId,
    scope,
    rowId,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-3">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading attachments…</p>
          ) : (
            <>
              <DocumentList
                documents={documents}
                access={access}
                currentUserId={currentUserId}
                onChange={reload}
              />
              {hasMore && (
                <div className="mt-3 text-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={loadingMore}
                    onClick={loadMore}
                  >
                    {loadingMore ? "Loading…" : "Load more"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
      <UploadDropzone
        sheetId={sheetId}
        rowId={scope === "row" ? rowId : null}
        access={access}
        onUploaded={reload}
      />
    </div>
  );
}

export function AttachmentsPanel({
  sheetId,
  access,
  currentUserId,
  rowId,
  showScopeTabs = true,
}: {
  sheetId: string;
  access: AccessContext;
  currentUserId: string;
  rowId?: string | null;
  showScopeTabs?: boolean;
}) {
  const [tab, setTab] = useState<"all" | "sheet" | "row">(rowId ? "all" : "sheet");

  if (!showScopeTabs) {
    return (
      <ScopedAttachments
        sheetId={sheetId}
        scope="all"
        rowId={rowId}
        access={access}
        currentUserId={currentUserId}
      />
    );
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as "all" | "sheet" | "row")}
      className="flex min-h-0 flex-1 flex-col"
    >
      <TabsList variant="line" className="w-full shrink-0 justify-start px-1">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="sheet">Sheet</TabsTrigger>
        <TabsTrigger value="row" disabled={!rowId}>
          Row
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="flex min-h-0 flex-1 flex-col">
        <ScopedAttachments
          sheetId={sheetId}
          scope="all"
          rowId={rowId}
          access={access}
          currentUserId={currentUserId}
        />
      </TabsContent>
      <TabsContent value="sheet" className="flex min-h-0 flex-1 flex-col">
        <ScopedAttachments
          sheetId={sheetId}
          scope="sheet"
          access={access}
          currentUserId={currentUserId}
        />
      </TabsContent>
      <TabsContent value="row" className="flex min-h-0 flex-1 flex-col">
        <ScopedAttachments
          sheetId={sheetId}
          scope="row"
          rowId={rowId}
          access={access}
          currentUserId={currentUserId}
        />
      </TabsContent>
    </Tabs>
  );
}
