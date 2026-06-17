import { Suspense } from "react";
import { listProperties } from "@/actions/properties";
import { PropertiesTable } from "@/components/properties/properties-table";
import { PropertiesGridToolbar } from "@/components/properties/properties-grid-toolbar";
import { CreateMenu } from "@/components/layout/create-menu";
import { SheetHeader } from "@/components/layout/sheet-header";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { requireProfile } from "@/lib/auth/guards";
import { canEditContact } from "@/lib/permissions/contact";
import { canUploadDocument } from "@/lib/permissions/document";
import {
  canCreateProperty,
  canEditProperty,
  canEditProspect,
} from "@/lib/permissions/property";
import type { PropertyStatus } from "@/types/domain";

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const profile = await requireProfile();
  const params = await searchParams;

  const status = (params.status as PropertyStatus | "all") || "active";
  const sort = (params.sort as "name" | "created_at" | "city") || "name";
  const page = Number(params.page ?? 1);

  const { properties, totalPages, page: currentPage, total } = await listProperties({
    q: params.q,
    status,
    sort,
    page,
  });

  return (
    <ListPageShell
      header={
        <SheetHeader
          title="Properties"
          subtitle={`${total} ${status === "all" ? "total" : status}`}
          actions={
            <CreateMenu
              canCreateProperty={canCreateProperty(profile)}
              canCreateProspect={canEditProspect(profile)}
              canCreateContact={canEditContact(profile)}
              canUploadDocument={canUploadDocument(profile)}
            />
          }
        />
      }
      toolbar={
        <Suspense fallback={<div className="h-9 border-b bg-muted/30" />}>
          <PropertiesGridToolbar totalPages={totalPages} currentPage={currentPage} />
        </Suspense>
      }
    >
      <PropertiesTable properties={properties} canEdit={canEditProperty(profile)} />
    </ListPageShell>
  );
}
