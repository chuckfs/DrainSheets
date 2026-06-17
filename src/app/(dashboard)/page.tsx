import { getAssignedProperties } from "@/actions/dashboard";
import { RecentsPageContent } from "@/components/recents/recents-page-content";
import { CreateMenu } from "@/components/layout/create-menu";
import { SheetHeader } from "@/components/layout/sheet-header";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { requireProfile } from "@/lib/auth/guards";
import { canEditContact } from "@/lib/permissions/contact";
import { canUploadDocument } from "@/lib/permissions/document";
import {
  canCreateProperty,
  canEditProspect,
} from "@/lib/permissions/property";
import type { Property } from "@/types/domain";

function toProperty(entry: Awaited<ReturnType<typeof getAssignedProperties>>[number]): Property {
  return {
    id: entry.id,
    name: entry.name,
    address: null,
    city: entry.city,
    state: entry.state,
    description: null,
    status: "active",
    created_at: entry.updated_at,
    updated_at: entry.updated_at,
    org_id: "",
    search_vector: null,
    created_by: null,
  };
}

export default async function RecentsPage() {
  const profile = await requireProfile();
  const assignedProperties = await getAssignedProperties();
  const isEditor = profile.role === "editor";

  return (
    <ListPageShell
      header={
        <SheetHeader
          title="Recents"
          subtitle={
            isEditor
              ? "Showing properties assigned to you"
              : "Recently opened property sheets"
          }
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
    >
      <RecentsPageContent properties={assignedProperties.map(toProperty)} />
    </ListPageShell>
  );
}
