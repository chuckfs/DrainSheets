import { Suspense } from "react";
import { listContacts } from "@/actions/contacts";
import { ContactsGridToolbar } from "@/components/contacts/contacts-grid-toolbar";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { SheetHeader } from "@/components/layout/sheet-header";
import { ListPageShell } from "@/components/layout/list-page-shell";
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
    <ListPageShell
      header={
        <SheetHeader
          title="Contacts"
          subtitle={`${total} across all prospects`}
        />
      }
      toolbar={
        <Suspense fallback={<div className="h-9 border-b bg-muted/30" />}>
          <ContactsGridToolbar totalPages={totalPages} currentPage={currentPage} />
        </Suspense>
      }
    >
      <ContactsTable
        contacts={contacts}
        canEdit={canEditContact(profile)}
        canDelete={canDeleteContact(profile)}
      />
    </ListPageShell>
  );
}
