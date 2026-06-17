import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  listEditors,
  listPropertyAssignments,
} from "@/actions/assignments";
import { getPropertyActivity } from "@/actions/activity";
import { listContactsForProperty } from "@/actions/contacts";
import { getDocumentsForProperty } from "@/actions/documents";
import { getNotesForProperty } from "@/actions/notes";
import { getProperty } from "@/actions/properties";
import { listProspects } from "@/actions/prospects";
import { listOrgUsers } from "@/actions/users";
import { PropertyDetailView } from "@/components/properties/property-detail-view";
import { requireProfile } from "@/lib/auth/guards";
import { canManageAssignments } from "@/lib/permissions/property";
import { canUploadDocument } from "@/lib/permissions/document";
import { buildProspectIndicators } from "@/lib/prospects/indicators";
import { GridSkeletonRows } from "@/components/data/grid-pinned-columns";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireProfile();
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    notFound();
  }

  const canManage = canManageAssignments(profile);

  const [
    { prospects },
    documents,
    notes,
    activities,
    contactLabels,
    assignments,
    editors,
    orgUsers,
  ] = await Promise.all([
    listProspects({ propertyId: id, page: 1 }),
    getDocumentsForProperty(id),
    getNotesForProperty(id),
    getPropertyActivity(id),
    listContactsForProperty(id),
    canManage ? listPropertyAssignments(id) : Promise.resolve([]),
    canManage ? listEditors() : Promise.resolve([]),
    canManage ? listOrgUsers() : Promise.resolve([]),
  ]);

  const indicators = buildProspectIndicators(documents, notes);

  return (
    <Suspense
      fallback={
        <div className="-m-3 min-h-[calc(100vh-3rem)]">
          <GridSkeletonRows rows={15} cols={8} />
        </div>
      }
    >
      <PropertyDetailView
        property={property}
        prospects={prospects}
        contactLabels={contactLabels}
        indicators={indicators}
        documents={documents}
        notes={notes}
        activities={activities}
        profile={profile}
        canUpload={canUploadDocument(profile) && property.status === "active"}
        editors={editors}
        assignments={assignments}
        orgUsers={orgUsers}
        meta={{
          prospectCount: prospects.length,
          contactCount: contactLabels.length,
          documentCount: documents.length,
          editorCount: assignments.length,
        }}
      />
    </Suspense>
  );
}
