import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPropertyActivity } from "@/actions/activity";
import { listContacts } from "@/actions/contacts";
import { getDocumentsForProspect } from "@/actions/documents";
import { getNotesForProspect } from "@/actions/notes";
import { getProspect } from "@/actions/prospects";
import { ProspectDetailView } from "@/components/prospects/prospect-detail-view";
import { requireProfile } from "@/lib/auth/guards";
import { canUploadDocument } from "@/lib/permissions/document";

function filterProspectActivities(
  activities: Awaited<ReturnType<typeof getPropertyActivity>>,
  prospectId: string,
  contactIds: Set<string>,
) {
  return activities.filter(
    (activity) =>
      (activity.entity_type === "prospect" && activity.entity_id === prospectId) ||
      (activity.entity_type === "contact" && contactIds.has(activity.entity_id)),
  );
}

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

  const [{ contacts }, documents, notes, propertyActivities] = await Promise.all([
    listContacts({ prospectId: id, page: 1 }),
    getDocumentsForProspect(id),
    getNotesForProspect(id),
    getPropertyActivity(prospect.property_id),
  ]);

  const contactIds = new Set(contacts.map((contact) => contact.id));
  const activities = filterProspectActivities(propertyActivities, id, contactIds);

  return (
    <Suspense fallback={<div className="-m-3 min-h-[calc(100vh-3rem)] animate-pulse bg-muted/20" />}>
      <ProspectDetailView
        prospect={prospect}
        contacts={contacts}
        documents={documents}
        notes={notes}
        activities={activities}
        profile={profile}
        canUpload={canUploadDocument(profile)}
      />
    </Suspense>
  );
}
