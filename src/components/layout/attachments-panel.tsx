"use client";

import { useEffect, useMemo, useState } from "react";
import type { DocumentWithRelations } from "@/actions/documents";
import type { NoteWithAuthor } from "@/actions/notes";
import type { ProspectWithProperty } from "@/actions/prospects";
import { CompactDocumentsListWithPreview } from "@/components/documents/compact-documents-list-with-preview";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { CompactNotesList } from "@/components/notes/compact-notes-list";
import { QuickNoteForm } from "@/components/notes/quick-note-form";
import { RowContextHeader } from "@/components/properties/row-context-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { canCreateNote } from "@/lib/permissions/note";
import type { Profile } from "@/types/domain";

type ScopeTab = "row" | "sheet" | "all";

function filterDocuments(
  documents: DocumentWithRelations[],
  scope: ScopeTab,
  selectedProspectId: string | null,
): DocumentWithRelations[] {
  if (scope === "all") return documents;
  if (scope === "sheet") {
    return documents.filter((doc) => !doc.prospect_id);
  }
  if (!selectedProspectId) return [];
  return documents.filter((doc) => doc.prospect_id === selectedProspectId);
}

function filterNotes(
  notes: NoteWithAuthor[],
  scope: ScopeTab,
  selectedProspectId: string | null,
): NoteWithAuthor[] {
  if (scope === "all") return notes;
  if (scope === "sheet") {
    return notes.filter((note) => !note.prospect_id);
  }
  if (!selectedProspectId) return [];
  return notes.filter((note) => note.prospect_id === selectedProspectId);
}

export function AttachmentsPanelContent({
  propertyId,
  documents,
  notes,
  prospects,
  profile,
  canUpload,
  selectedProspectId,
  selectedProspectName,
  selectedProspectCategory,
  onClose,
  variant = "property",
  uploadRequest = 0,
  noteRequest = 0,
}: {
  propertyId: string;
  documents: DocumentWithRelations[];
  notes: NoteWithAuthor[];
  prospects: ProspectWithProperty[];
  profile: Profile;
  canUpload: boolean;
  selectedProspectId: string | null;
  selectedProspectName?: string | null;
  selectedProspectCategory?: string | null;
  selectedRowLabel?: string | null;
  onClose: () => void;
  variant?: "property" | "prospect";
  uploadRequest?: number;
  noteRequest?: number;
}) {
  const isProspectVariant = variant === "prospect";
  const [scope, setScope] = useState<ScopeTab>(isProspectVariant ? "row" : "all");
  const [showUpload, setShowUpload] = useState(false);
  const canCreate = canCreateNote(profile);

  const resolvedProspectName = useMemo(() => {
    if (selectedProspectName) return selectedProspectName;
    if (!selectedProspectId) return null;
    return prospects.find((prospect) => prospect.id === selectedProspectId)?.company_name ?? null;
  }, [prospects, selectedProspectId, selectedProspectName]);

  useEffect(() => {
    if (isProspectVariant) return;
    if (selectedProspectId) {
      setScope("row");
    }
  }, [selectedProspectId, isProspectVariant]);

  useEffect(() => {
    if (uploadRequest <= 0) return;
    setShowUpload(true);
    if (isProspectVariant || selectedProspectId) {
      setScope("row");
    } else {
      setScope("sheet");
    }
  }, [uploadRequest, isProspectVariant, selectedProspectId]);

  const scopedDocuments = isProspectVariant
    ? documents
    : filterDocuments(documents, scope, selectedProspectId);
  const scopedNotes = isProspectVariant
    ? notes
    : filterNotes(notes, scope, selectedProspectId);
  const uploadProspectId = isProspectVariant
    ? selectedProspectId
    : scope === "row"
      ? selectedProspectId
      : scope === "sheet"
        ? null
        : selectedProspectId;

  const showRowEmptyState = !isProspectVariant && !selectedProspectId && scope === "row";

  function openAttachToRow() {
    setScope("row");
    setShowUpload(true);
  }

  const showRowContext =
    (isProspectVariant || (selectedProspectId && scope === "row")) && resolvedProspectName;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Attachments</h2>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
          ×
        </Button>
      </div>

      {showRowContext && (
        <RowContextHeader
          companyName={resolvedProspectName!}
          category={selectedProspectCategory ?? prospects.find((p) => p.id === selectedProspectId)?.category}
          documentCount={scopedDocuments.length}
          noteCount={scopedNotes.length}
        />
      )}

      {!isProspectVariant && selectedProspectId && resolvedProspectName && canUpload && (
        <div className="border-b px-2 py-2">
          <Button type="button" size="sm" className="btn-share h-8 w-full text-xs" onClick={openAttachToRow}>
            Attach to {resolvedProspectName}
          </Button>
        </div>
      )}

      <Tabs
        value={isProspectVariant ? "row" : scope}
        onValueChange={(value) => setScope(value as ScopeTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        {!isProspectVariant && (
          <>
            <TabsList variant="line" className="h-8 w-full justify-start rounded-none border-b px-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <span className="inline-flex">
                      <TabsTrigger value="row" className="text-xs" disabled={!selectedProspectId}>
                        Row
                      </TabsTrigger>
                    </span>
                  }
                />
                {!selectedProspectId && (
                  <TooltipContent>
                    Choose a row to access row-level files and notes.
                  </TooltipContent>
                )}
              </Tooltip>
              <TabsTrigger value="sheet" className="text-xs">
                Sheet
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
            </TabsList>
            {!selectedProspectId && (
              <div className="space-y-2 border-b px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Select a prospect row to view row attachments.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setScope("sheet")}
                >
                  View property documents
                </Button>
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-2 border-b px-2 py-1.5">
          {canUpload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowUpload((value) => !value)}
            >
              {showUpload ? "Cancel upload" : "Upload"}
            </Button>
          )}
        </div>

        {canUpload && showUpload && (
          <div className="border-b p-2">
            <DocumentUploadForm
              propertyId={propertyId}
              prospectId={uploadProspectId}
              prospects={prospects}
              onSuccess={() => setShowUpload(false)}
            />
          </div>
        )}

        <TabsContent value={isProspectVariant ? "row" : scope} className="min-h-0 flex-1 overflow-auto p-0">
          {showRowEmptyState ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <p className="text-xs text-muted-foreground">
                Select a prospect row to see row-level documents and notes.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setScope("sheet")}
              >
                View property documents
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-2">
              {canCreate && (
                <QuickNoteForm
                  propertyId={propertyId}
                  prospectId={uploadProspectId}
                  expandRequest={noteRequest}
                />
              )}
              <section>
                <h3 className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Documents ({scopedDocuments.length})
                </h3>
                <CompactDocumentsListWithPreview
                  documents={scopedDocuments}
                  profile={profile}
                />
              </section>
              <section>
                <h3 className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Notes ({scopedNotes.length})
                </h3>
                <CompactNotesList
                  notes={scopedNotes}
                  profile={profile}
                  propertyId={propertyId}
                  prospectId={uploadProspectId}
                />
              </section>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function AttachmentsPanel({
  className,
  ...props
}: React.ComponentProps<typeof AttachmentsPanelContent> & { className?: string }) {
  return (
    <aside
      className={cn(
        "hidden min-h-0 w-80 shrink-0 flex-col overflow-hidden border-l bg-background md:flex",
        className,
      )}
    >
      <AttachmentsPanelContent {...props} />
    </aside>
  );
}

export function SidePanelContent({
  title,
  onClose,
  children,
  bodyClassName,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b px-3 py-2">
        <h2 className="text-sm font-medium">{title}</h2>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
          ×
        </Button>
      </div>
      <div className={cn("min-h-0 flex-1 overflow-auto p-3", bodyClassName)}>{children}</div>
    </>
  );
}

export function SidePanel({
  title,
  onClose,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <aside
      className={cn(
        "hidden min-h-0 w-80 shrink-0 flex-col overflow-hidden border-l bg-background md:flex",
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SidePanelContent title={title} onClose={onClose} bodyClassName={bodyClassName}>
          {children}
        </SidePanelContent>
      </div>
    </aside>
  );
}
