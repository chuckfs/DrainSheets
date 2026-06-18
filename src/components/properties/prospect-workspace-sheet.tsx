"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ContactWithProspect } from "@/actions/contacts";
import { listContacts } from "@/actions/contacts";
import type { DocumentWithRelations } from "@/actions/documents";
import type { NoteWithAuthor } from "@/actions/notes";
import type { ProspectWithProperty } from "@/actions/prospects";
import { CompactDocumentsListWithPreview } from "@/components/documents/compact-documents-list-with-preview";
import { CompactNotesList } from "@/components/notes/compact-notes-list";
import { QuickNoteForm } from "@/components/notes/quick-note-form";
import { contactDisplayName } from "@/lib/contacts/display";
import { canEditProspect } from "@/lib/permissions/property";
import { canEditContact } from "@/lib/permissions/contact";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types/domain";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";
import { GridSkeletonRows } from "@/components/data/grid-pinned-columns";

function WorkspaceContactsTable({
  contacts,
  prospectId,
  canEdit,
}: {
  contacts: ContactWithProspect[];
  prospectId: string;
  canEdit: boolean;
}) {
  if (contacts.length === 0) {
    return (
      <div>
        <SmartsheetGridEmpty message="No contacts on this row yet." />
        {canEdit && (
          <div className="mt-2 text-center">
            <Link
              href={`/prospects/${prospectId}/contacts/new`}
              className="text-xs text-link hover:underline"
            >
              Add contact
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <SmartsheetGrid className="border-x-0">
      <SmartsheetGridHeader>
        <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
          <SmartsheetGridHead>Name</SmartsheetGridHead>
          <SmartsheetGridHead className="w-40">Email</SmartsheetGridHead>
          <SmartsheetGridHead className="w-28">Phone</SmartsheetGridHead>
        </SmartsheetGridRow>
      </SmartsheetGridHeader>
      <SmartsheetGridBody>
        {contacts.map((contact) => (
          <SmartsheetGridRow key={contact.id}>
            <SmartsheetGridCell>
              <Link href={`/contacts/${contact.id}`} className="text-link hover:underline">
                {contactDisplayName(contact)}
              </Link>
            </SmartsheetGridCell>
            <SmartsheetGridCell className="truncate text-muted-foreground">
              {contact.email ?? "—"}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="text-muted-foreground">{contact.phone ?? "—"}</SmartsheetGridCell>
          </SmartsheetGridRow>
        ))}
      </SmartsheetGridBody>
    </SmartsheetGrid>
  );
}

export function ProspectWorkspaceSheet({
  prospect,
  propertyId,
  documents,
  notes,
  profile,
  canUpload,
  open,
  onOpenChange,
  onAttachClick,
  fullScreen = false,
}: {
  prospect: ProspectWithProperty | null;
  propertyId: string;
  documents: DocumentWithRelations[];
  notes: NoteWithAuthor[];
  profile: Profile;
  canUpload: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAttachClick?: () => void;
  fullScreen?: boolean;
}) {
  const [contacts, setContacts] = useState<ContactWithProspect[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const prospectDocuments = useMemo(
    () => (prospect ? documents.filter((doc) => doc.prospect_id === prospect.id) : []),
    [documents, prospect],
  );

  const prospectNotes = useMemo(
    () => (prospect ? notes.filter((note) => note.prospect_id === prospect.id) : []),
    [notes, prospect],
  );

  const loadContacts = useCallback(async (prospectId: string) => {
    setLoadingContacts(true);
    try {
      const result = await listContacts({ prospectId, page: 1 });
      setContacts(result.contacts);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    if (open && prospect) {
      void loadContacts(prospect.id);
    }
  }, [open, prospect, loadContacts]);

  if (!prospect) return null;

  const canEdit = canEditProspect(profile);
  const canAddContact = canEditContact(profile);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={fullScreen ? "bottom" : "right"}
        className={cn(
          "flex w-full flex-col gap-0 overflow-hidden p-0",
          fullScreen ? "h-[100dvh] max-h-[100dvh] rounded-none sm:max-w-none" : "sm:max-w-lg",
        )}
        showCloseButton
      >
        <SheetHeader className="shrink-0 border-b px-4 py-3">
          <SheetTitle>{prospect.company_name}</SheetTitle>
          <SheetDescription>Prospect workspace · stay on the property sheet</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <section className="mb-4 space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Overview
            </h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] text-muted-foreground">Company</dt>
                <dd>{prospect.company_name}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Status</dt>
                <dd className="capitalize">{prospect.status ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Category</dt>
                <dd>{prospect.category ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-muted-foreground">Website</dt>
                <dd className="truncate">
                  {prospect.website ? (
                    <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
                      {prospect.website}
                    </a>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
            </dl>
            {prospect.comments && (
              <div>
                <dt className="text-[11px] text-muted-foreground">Comments</dt>
                <dd className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {prospect.comments}
                </dd>
              </div>
            )}
          </section>

          <section className="mb-4">
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Contacts
            </h3>
            {loadingContacts ? (
              <GridSkeletonRows rows={3} cols={3} />
            ) : (
              <WorkspaceContactsTable
                contacts={contacts}
                prospectId={prospect.id}
                canEdit={canAddContact}
              />
            )}
          </section>

          <section className="mb-4">
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Documents
            </h3>
            <CompactDocumentsListWithPreview documents={prospectDocuments} profile={profile} />
          </section>

          <section>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Notes
            </h3>
            <div className="space-y-2">
              <QuickNoteForm propertyId={propertyId} prospectId={prospect.id} />
              <CompactNotesList
                notes={prospectNotes}
                profile={profile}
                propertyId={propertyId}
                prospectId={prospect.id}
              />
            </div>
          </section>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 border-t px-4 py-3">
          {canEdit && (
            <Link
              href={`/prospects/${prospect.id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
            >
              Edit Prospect
            </Link>
          )}
          <Link
            href={`/prospects/${prospect.id}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-7 text-xs")}
          >
            Open Full Record
          </Link>
          {canUpload && onAttachClick && (
            <Button type="button" size="sm" className="btn-share h-7 text-xs" onClick={onAttachClick}>
              Attach file
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
