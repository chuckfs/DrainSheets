import { Suspense } from "react";
import { listProperties } from "@/actions/properties";
import { listFavoritePropertyIds } from "@/actions/favorites";
import { getRecentViewedAtMap } from "@/actions/recents";
import { PropertiesTable } from "@/components/properties/properties-table";
import { PropertiesGridToolbar } from "@/components/properties/properties-grid-toolbar";
import { CreateMenu } from "@/components/layout/create-menu";
import { ImportLauncher } from "@/components/import/import-launcher";
import { SheetHeader } from "@/components/layout/sheet-header";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { SmartsheetGridEmpty } from "@/components/data/smartsheet-grid";
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
  const isEditor = profile.role === "editor";

  const status = (params.status as PropertyStatus | "all") || "active";
  const sort = (params.sort as "name" | "created_at" | "city") || "name";
  const page = Number(params.page ?? 1);

  const { properties, totalPages, page: currentPage, total } = await listProperties({
    q: params.q,
    status,
    sort,
    page,
  });

  const propertyIds = properties.map((property) => property.id);
  const [favoritePropertyIds, recentViewedAt] = await Promise.all([
    listFavoritePropertyIds(),
    getRecentViewedAtMap(propertyIds),
  ]);

  const subtitle = isEditor
    ? "Showing properties assigned to you"
    : `${total} ${status === "all" ? "total" : status}`;

  return (
    <ListPageShell
      header={
        <SheetHeader
          title="Properties"
          subtitle={subtitle}
          actions={
            <div className="flex items-center gap-2">
              <ImportLauncher
                canImportProperties={canCreateProperty(profile)}
                canImportProspects={canEditProspect(profile)}
                canImportContacts={canEditContact(profile)}
              />
              <CreateMenu
              canCreateProperty={canCreateProperty(profile)}
              canCreateProspect={canEditProspect(profile)}
              canCreateContact={canEditContact(profile)}
              canUploadDocument={canUploadDocument(profile)}
            />
            </div>
          }
        />
      }
      toolbar={
        <Suspense fallback={<div className="h-9 border-b bg-muted/30" />}>
          <PropertiesGridToolbar totalPages={totalPages} currentPage={currentPage} />
        </Suspense>
      }
    >
      {properties.length === 0 && isEditor ? (
        <SmartsheetGridEmpty message="No properties assigned yet. Contact an administrator to gain access." />
      ) : (
        <PropertiesTable
          properties={properties}
          canEdit={canEditProperty(profile)}
          favoritePropertyIds={favoritePropertyIds}
          recentViewedAt={recentViewedAt}
        />
      )}
    </ListPageShell>
  );
}
