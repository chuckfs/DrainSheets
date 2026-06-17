"use client";

import Link from "next/link";
import { Contact } from "lucide-react";
import type { ContactWithProspect } from "@/actions/contacts";
import { ContactRowActions } from "@/components/contacts/contact-row-actions";
import { contactDisplayName } from "@/lib/contacts/display";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";

export function ProspectContactsGrid({
  contacts,
  prospectId,
  canEdit,
  canDelete,
  canAddContact,
}: {
  contacts: ContactWithProspect[];
  prospectId: string;
  canEdit: boolean;
  canDelete: boolean;
  canAddContact: boolean;
}) {
  const showActions = canEdit || canDelete;

  if (contacts.length === 0) {
    return (
      <div className="p-4">
        <SmartsheetGridEmpty message="No contacts on this row yet." />
        {canAddContact && (
          <div className="mt-3 text-center">
            <Link
              href={`/prospects/${prospectId}/contacts/new`}
              className="text-sm text-link hover:underline"
            >
              Add the first contact
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
          <SmartsheetGridHead className="w-10 text-center"> </SmartsheetGridHead>
          <SmartsheetGridHead>Name</SmartsheetGridHead>
          <SmartsheetGridHead className="hidden w-28 sm:table-cell">Title</SmartsheetGridHead>
          <SmartsheetGridHead className="hidden w-32 md:table-cell">Company</SmartsheetGridHead>
          <SmartsheetGridHead className="hidden w-40 lg:table-cell">Email</SmartsheetGridHead>
          <SmartsheetGridHead className="hidden w-28 md:table-cell">Phone</SmartsheetGridHead>
          {showActions && <SmartsheetGridHead className="w-12 text-center"> </SmartsheetGridHead>}
        </SmartsheetGridRow>
      </SmartsheetGridHeader>
      <SmartsheetGridBody>
        {contacts.map((contact) => (
          <SmartsheetGridRow key={contact.id}>
            <SmartsheetGridCell className="text-center">
              <Contact className="mx-auto size-3.5 text-sheet-icon" aria-hidden />
            </SmartsheetGridCell>
            <SmartsheetGridCell>
              <Link
                href={`/contacts/${contact.id}`}
                className="font-medium text-link hover:underline"
              >
                {contactDisplayName(contact)}
              </Link>
            </SmartsheetGridCell>
            <SmartsheetGridCell className="hidden text-muted-foreground sm:table-cell">
              {contact.title ?? "—"}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="hidden truncate text-muted-foreground md:table-cell">
              {contact.company ?? "—"}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="hidden max-w-[180px] truncate text-muted-foreground lg:table-cell">
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="text-link hover:underline">
                  {contact.email}
                </a>
              ) : (
                "—"
              )}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="hidden text-muted-foreground md:table-cell">
              {contact.phone ?? "—"}
            </SmartsheetGridCell>
            {showActions && (
              <SmartsheetGridCell className="text-center">
                <ContactRowActions
                  contactId={contact.id}
                  prospectId={prospectId}
                  contactName={contactDisplayName(contact)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                />
              </SmartsheetGridCell>
            )}
          </SmartsheetGridRow>
        ))}
      </SmartsheetGridBody>
    </SmartsheetGrid>
  );
}
