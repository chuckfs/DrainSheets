"use client";

import { memo } from "react";
import { ContactPicker } from "@/components/sheets/contact-picker";
import { ContactCellContent } from "@/components/data/grid-pinned-columns";
import { contactDisplayName } from "@/lib/contacts/display";
import { cn } from "@/lib/utils";
import { useSheetContacts } from "@/components/sheets/sheet-contact-context";
import type { CellRendererProps } from "./types";
import { valueToString } from "./utils";

function ContactRendererComponent(props: CellRendererProps) {
  const contactsContext = useSheetContacts();
  const contactId = valueToString(props.value);
  const contact = contactId ? contactsContext?.contactsById.get(contactId) : undefined;

  if (props.mode === "display") {
    if (contact) {
      return (
        <ContactCellContent
          label={contactDisplayName(contact)}
          email={contact.email}
          phone={contact.phone}
        />
      );
    }

    return (
      <span className={cn("block truncate text-xs", !contactId && "text-muted-foreground")}>
        {contactId || "—"}
      </span>
    );
  }

  return (
    <ContactPicker
      value={contactId || null}
      onCommit={(next) => props.onCommit(next)}
      onCancel={props.onCancel}
    />
  );
}

export const ContactRenderer = memo(ContactRendererComponent);
