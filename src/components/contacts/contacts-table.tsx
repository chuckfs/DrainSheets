import Link from "next/link";
import { Contact } from "lucide-react";
import type { ContactWithProspect } from "@/actions/contacts";
import { contactDisplayName } from "@/lib/contacts/display";
import { ContactRowActions } from "@/components/contacts/contact-row-actions";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";

export function ContactsTable({
  contacts,
  canEdit,
  canDelete,
}: {
  contacts: ContactWithProspect[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const showActions = canEdit || canDelete;

  if (contacts.length === 0) {
    return <SmartsheetGridEmpty message="No contacts found." />;
  }

  return (
    <SmartsheetGrid>
      <SmartsheetGridHeader>
        <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
          <SmartsheetGridHead className="w-10 text-center"> </SmartsheetGridHead>
          <SmartsheetGridHead>Name</SmartsheetGridHead>
          <SmartsheetGridHead>Company</SmartsheetGridHead>
          <SmartsheetGridHead>Prospect</SmartsheetGridHead>
          <SmartsheetGridHead>Property</SmartsheetGridHead>
          <SmartsheetGridHead>Email</SmartsheetGridHead>
          <SmartsheetGridHead className="w-28">Phone</SmartsheetGridHead>
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
            <SmartsheetGridCell className="max-w-[140px] truncate text-muted-foreground">
              {contact.company ?? "—"}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="max-w-[160px] truncate text-muted-foreground">
              {contact.prospects ? (
                <Link
                  href={`/prospects/${contact.prospects.id}`}
                  className="text-link hover:underline"
                >
                  {contact.prospects.company_name}
                </Link>
              ) : (
                "—"
              )}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="max-w-[140px] truncate text-muted-foreground">
              {contact.prospects?.properties ? (
                <Link
                  href={`/properties/${contact.prospects.properties.id}`}
                  className="text-link hover:underline"
                >
                  {contact.prospects.properties.name}
                </Link>
              ) : (
                "—"
              )}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="max-w-[180px] truncate text-muted-foreground">
              {contact.email ? (
                <a href={`mailto:${contact.email}`} className="text-link hover:underline">
                  {contact.email}
                </a>
              ) : (
                "—"
              )}
            </SmartsheetGridCell>
            <SmartsheetGridCell className="text-muted-foreground">
              {contact.phone ?? "—"}
            </SmartsheetGridCell>
            {showActions && (
              <SmartsheetGridCell className="text-center">
                <ContactRowActions
                  contactId={contact.id}
                  prospectId={contact.prospect_id}
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
