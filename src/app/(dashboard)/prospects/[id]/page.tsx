import Link from "next/link";
import { notFound } from "next/navigation";
import { getProspect } from "@/actions/prospects";
import { listContacts } from "@/actions/contacts";
import { ProspectContactsTable } from "@/components/contacts/prospect-contacts-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireProfile } from "@/lib/auth/guards";
import { canDeleteContact, canEditContact } from "@/lib/permissions/contact";

export default async function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const prospect = await getProspect(id);

  if (!prospect) {
    notFound();
  }

  const { contacts } = await listContacts({ prospectId: id, page: 1 });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {prospect.properties ? (
              <Link href={`/properties/${prospect.properties.id}`} className="hover:underline">
                {prospect.properties.name}
              </Link>
            ) : (
              "Unknown property"
            )}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{prospect.company_name}</h1>
            {prospect.status && (
              <Badge variant="secondary" className="capitalize">
                {prospect.status}
              </Badge>
            )}
          </div>
          {prospect.category && (
            <p className="mt-1 text-muted-foreground">{prospect.category}</p>
          )}
        </div>
        <Link
          href={`/prospects/${id}/edit`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Edit
        </Link>
      </div>

      {prospect.website && (
        <div>
          <h2 className="text-sm font-medium">Website</h2>
          <a
            href={prospect.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            {prospect.website}
          </a>
        </div>
      )}

      {prospect.comments && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-sm font-medium">Comments</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{prospect.comments}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Contacts</h2>
          {canEditContact(profile) && (
            <Link
              href={`/prospects/${id}/contacts/new`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Add contact
            </Link>
          )}
        </div>
        <ProspectContactsTable
          contacts={contacts}
          prospectId={id}
          canEdit={canEditContact(profile)}
          canDelete={canDeleteContact(profile)}
        />
      </div>
    </div>
  );
}
