import Link from "next/link";
import type { ContactWithProspect } from "@/actions/contacts";
import { DeleteContactButton } from "@/components/contacts/delete-contact-button";
import { contactDisplayName } from "@/lib/contacts/display";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ProspectContactsTable({
  contacts,
  prospectId,
  canEdit,
  canDelete,
}: {
  contacts: ContactWithProspect[];
  prospectId: string;
  canEdit: boolean;
  canDelete: boolean;
}) {
  if (contacts.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No contacts yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="border-b bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Name</th>
            <th className="px-4 py-3 text-left font-medium">Title</th>
            <th className="px-4 py-3 text-left font-medium">Company</th>
            <th className="px-4 py-3 text-left font-medium">Email</th>
            <th className="px-4 py-3 text-left font-medium">Phone</th>
            {(canEdit || canDelete) && (
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id} className="border-b last:border-b-0 hover:bg-muted/30">
              <td className="px-4 py-3">
                <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                  {contactDisplayName(contact)}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{contact.title ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{contact.company ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="hover:underline">
                    {contact.email}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{contact.phone ?? "—"}</td>
              {(canEdit || canDelete) && (
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
                    >
                      View
                    </Link>
                    {canEdit && (
                      <Link
                        href={`/contacts/${contact.id}/edit`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        Edit
                      </Link>
                    )}
                    {canDelete && (
                      <DeleteContactButton
                        contactId={contact.id}
                        prospectId={prospectId}
                        contactName={contactDisplayName(contact)}
                        redirectTo={`/prospects/${prospectId}`}
                      />
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
