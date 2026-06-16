import Link from "next/link";
import { notFound } from "next/navigation";
import { getContact } from "@/actions/contacts";
import { DeleteContactButton } from "@/components/contacts/delete-contact-button";
import { contactDisplayName } from "@/lib/contacts/display";
import { requireProfile } from "@/lib/auth/guards";
import { canDeleteContact, canEditContact } from "@/lib/permissions/contact";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const contact = await getContact(id);

  if (!contact) {
    notFound();
  }

  const name = contactDisplayName(contact);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
          {(contact.title || contact.company) && (
            <p className="mt-1 text-muted-foreground">
              {[contact.title, contact.company].filter(Boolean).join(" at ")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {canEditContact(profile) && (
            <Link
              href={`/contacts/${id}/edit`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Edit
            </Link>
          )}
          {canDeleteContact(profile) && (
            <DeleteContactButton
              contactId={id}
              prospectId={contact.prospect_id}
              contactName={name}
              redirectTo="/contacts"
            />
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Contact details</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>
                {contact.email ? (
                  <a href={`mailto:${contact.email}`} className="hover:underline">
                    {contact.email}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{contact.phone ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-3 text-sm font-medium">Related records</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Prospect</dt>
              <dd>
                {contact.prospects ? (
                  <Link href={`/prospects/${contact.prospects.id}`} className="hover:underline">
                    {contact.prospects.company_name}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Property</dt>
              <dd>
                {contact.prospects?.properties ? (
                  <Link
                    href={`/properties/${contact.prospects.properties.id}`}
                    className="hover:underline"
                  >
                    {contact.prospects.properties.name}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {contact.notes && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-medium">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}
    </div>
  );
}
