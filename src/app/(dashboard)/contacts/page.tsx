import { Suspense } from "react";
import { listContacts } from "@/actions/contacts";
import { ContactFilters } from "@/components/contacts/contact-filters";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { requireProfile } from "@/lib/auth/guards";
import { canDeleteContact, canEditContact } from "@/lib/permissions/contact";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  const sort = (params.sort as "first_name" | "company" | "created_at") || "first_name";
  const page = Number(params.page ?? 1);

  const { contacts, totalPages, page: currentPage, total } = await listContacts({
    q: params.q,
    sort,
    page,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-muted-foreground">{total} total across all prospects</p>
      </div>

      <Suspense>
        <ContactFilters totalPages={totalPages} currentPage={currentPage} />
      </Suspense>

      <ContactsTable
        contacts={contacts}
        canEdit={canEditContact(profile)}
        canDelete={canDeleteContact(profile)}
      />
    </div>
  );
}
