"use client";

import { useEffect, useState } from "react";
import type { DocumentWithRelations } from "@/actions/documents";
import type { NoteWithAuthor } from "@/actions/notes";
import type { ProspectWithProperty } from "@/actions/prospects";
import { DocumentUploadForm } from "@/components/documents/document-upload-form";
import { DocumentsTable } from "@/components/documents/documents-table";
import { NoteForm } from "@/components/notes/note-form";
import { NotesList } from "@/components/notes/notes-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  selectedRowLabel,
  onClose,
  variant = "property",
}: {
  propertyId: string;
  documents: DocumentWithRelations[];
  notes: NoteWithAuthor[];
  prospects: ProspectWithProperty[];
  profile: Profile;
  canUpload: boolean;
  selectedProspectId: string | null;
  selectedRowLabel?: string | null;
  onClose: () => void;
  variant?: "property" | "prospect";
}) {
  const isProspectVariant = variant === "prospect";
  const [scope, setScope] = useState<ScopeTab>(isProspectVariant ? "row" : "all");
  const [showUpload, setShowUpload] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const canCreate = canCreateNote(profile);

  useEffect(() => {
    if (isProspectVariant) return;
    if (selectedProspectId) {
      setScope("row");
    }
  }, [selectedProspectId, isProspectVariant]);

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Attachments</h2>
          {selectedRowLabel && (isProspectVariant || scope === "row") && (
            <p className="truncate text-xs text-muted-foreground">{selectedRowLabel}</p>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
          ×
        </Button>
      </div>

      <Tabs
        value={isProspectVariant ? "row" : scope}
        onValueChange={(value) => setScope(value as ScopeTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        {!isProspectVariant && (
          <TabsList variant="line" className="h-8 w-full justify-start rounded-none border-b px-2">
            <TabsTrigger value="row" className="text-xs" disabled={!selectedProspectId}>
              Row
            </TabsTrigger>
            <TabsTrigger value="sheet" className="text-xs">
              Sheet
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              All
            </TabsTrigger>
          </TabsList>
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
          {canCreate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setShowNoteForm((value) => !value)}
            >
              {showNoteForm ? "Cancel note" : "Add note"}
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

        {canCreate && showNoteForm && (
          <div className="border-b p-2">
            <NoteForm
              propertyId={propertyId}
              prospectId={uploadProspectId}
              onSuccess={() => setShowNoteForm(false)}
            />
          </div>
        )}

        <TabsContent value={isProspectVariant ? "row" : scope} className="min-h-0 flex-1 overflow-auto p-0">
          <div className="space-y-3 p-2">
            <section>
              <h3 className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Documents ({scopedDocuments.length})
              </h3>
              <DocumentsTable
                documents={scopedDocuments}
                profile={profile}
                showProspect={!isProspectVariant && scope === "all"}
              />
            </section>
            <section>
              <h3 className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Notes ({scopedNotes.length})
              </h3>
              {scopedNotes.length === 0 ? (
                <p className="px-1 py-4 text-center text-xs text-muted-foreground">No notes.</p>
              ) : (
                <NotesList
                  notes={scopedNotes}
                  profile={profile}
                  propertyId={propertyId}
                  prospectId={uploadProspectId}
                />
              )}
            </section>
          </div>
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
        "hidden min-h-0 w-80 shrink-0 flex-col border-l bg-background md:flex",
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
        "hidden min-h-0 w-80 shrink-0 flex-col border-l bg-background md:flex",
        className,
      )}
    >
      <SidePanelContent title={title} onClose={onClose} bodyClassName={bodyClassName}>
        {children}
      </SidePanelContent>
    </aside>
  );
}
