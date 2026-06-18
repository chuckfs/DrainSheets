import { listFavorites } from "@/actions/favorites";
import { listRecentViews } from "@/actions/recents";
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

export default async function RecentsPage() {
  const profile = await requireProfile();
  const isEditor = profile.role === "editor";

  const [favorites, recents] = await Promise.all([listFavorites(), listRecentViews()]);

  return (
    <ListPageShell
      header={
        <SheetHeader
          title="Recents"
          subtitle={
            isEditor
              ? "Your favorites and recently opened assigned properties"
              : "Your favorites and recently opened property sheets"
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
      <RecentsPageContent favorites={favorites} recents={recents} />
    </ListPageShell>
  );
}
