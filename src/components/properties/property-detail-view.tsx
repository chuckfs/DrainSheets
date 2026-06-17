"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { Share2Icon } from "lucide-react";
import type { ActivityWithProfile } from "@/lib/activity/format";
import type { DocumentWithRelations } from "@/actions/documents";
import type { NoteWithAuthor } from "@/actions/notes";
import type { ProspectWithProperty } from "@/actions/prospects";
import type { PropertyProspectContact } from "@/actions/contacts";
import { CompactActivityFeed } from "@/components/dashboard/compact-activity-feed";
import {
  AttachmentsPanel,
  AttachmentsPanelContent,
  SidePanel,
  SidePanelContent,
} from "@/components/layout/attachments-panel";
import { DetailLayout } from "@/components/layout/detail-layout";
import { CreateMenu } from "@/components/layout/create-menu";
import { MetadataPill } from "@/components/layout/metadata-pill";
import { MobileUtilityBar } from "@/components/layout/mobile-utility-bar";
import { ResponsivePanel } from "@/components/layout/responsive-panel";
import { SheetHeader } from "@/components/layout/sheet-header";
import { UtilityRail } from "@/components/layout/utility-rail";
import { ManageAccessDialog } from "@/components/properties/manage-access-dialog";
import { PropertyOverflowMenu } from "@/components/properties/property-overflow-menu";
import {
  PropertyBreadcrumb,
  PropertyDetailTabs,
  type PropertyDetailTab,
} from "@/components/properties/property-detail-tabs";
import { PropertyProspectsGrid } from "@/components/properties/property-prospects-grid";
import { SharePropertyDialog } from "@/components/properties/share-property-dialog";
import { SharedWithSummary } from "@/components/properties/shared-with-summary";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-media-query";
import { useWorkspacePanel } from "@/hooks/use-workspace-panel";
import type { ProspectIndicatorCounts } from "@/lib/prospects/indicators";
import {
  canArchiveProperty,
  canEditProperty,
  canEditProspect,
  canManageAssignments,
  propertyStatusLabel,
} from "@/lib/permissions/property";
import { canEditContact } from "@/lib/permissions/contact";
import type { Profile, Property, UserRole } from "@/types/domain";

type Editor = { id: string; name: string; email: string };
type Assignment = {
  id: string;
  user_id: string;
  profiles: { id: string; name: string; email: string } | null;
};
type OrgUser = { id: string; name: string; email: string; role: UserRole };

export type PropertySheetMeta = {
  prospectCount: number;
  contactCount: number;
  documentCount: number;
  editorCount: number;
};

function parseTab(value: string | null): PropertyDetailTab {
  if (value === "details") return "details";
  return "grid";
}

export function PropertyDetailView({
  property,
  prospects,
  contactLabels,
  indicators,
  documents,
  notes,
  activities,
  profile,
  canUpload,
  editors,
  assignments,
  orgUsers,
  meta,
}: {
  property: Property;
  prospects: ProspectWithProperty[];
  contactLabels: PropertyProspectContact[];
  indicators: Map<string, ProspectIndicatorCounts>;
  documents: DocumentWithRelations[];
  notes: NoteWithAuthor[];
  activities: ActivityWithProfile[];
  profile: Profile;
  canUpload: boolean;
  editors: Editor[];
  assignments: Assignment[];
  orgUsers: OrgUser[];
  meta: PropertySheetMeta;
}) {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const isMobile = useIsMobile();

  const { activePanel, setActivePanel, togglePanel, closePanel } = useWorkspacePanel();
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [uploadRequest, setUploadRequest] = useState(0);

  const canManage = canManageAssignments(profile);
  const isActive = property.status === "active";
  const location = [property.address, property.city, property.state].filter(Boolean).join(", ");
  const canEdit = canEditProperty(profile);
  const canArchive = canArchiveProperty(profile);

  const selectedProspect = useMemo(
    () => prospects.find((prospect) => prospect.id === selectedProspectId) ?? null,
    [prospects, selectedProspectId],
  );

  const selectedRowLabel = useMemo(() => {
    if (!selectedProspect) return null;
    const index = prospects.findIndex((prospect) => prospect.id === selectedProspectId);
    if (index < 0) return null;
    return `Row ${index + 1}: ${selectedProspect.company_name}`;
  }, [prospects, selectedProspect, selectedProspectId]);

  useEffect(() => {
    if (selectedProspectId) {
      setActivePanel("attachments");
    }
  }, [selectedProspectId, setActivePanel]);

  const attachmentProps = {
    propertyId: property.id,
    documents,
    notes,
    prospects,
    profile,
    canUpload: canUpload && isActive,
    selectedProspectId,
    selectedProspectName: selectedProspect?.company_name ?? null,
    selectedRowLabel,
    onClose: closePanel,
    variant: "property" as const,
    uploadRequest,
  };

  function renderPanelContent() {
    if (!activePanel) return null;

    if (activePanel === "attachments") {
      return <AttachmentsPanelContent {...attachmentProps} />;
    }

    if (activePanel === "activity") {
      return (
        <SidePanelContent title="Activity" onClose={closePanel} bodyClassName="p-0">
          <CompactActivityFeed activities={activities} />
        </SidePanelContent>
      );
    }

    return (
      <SidePanelContent title="Property details" onClose={closePanel}>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </dt>
            <dd className="mt-0.5 capitalize">{propertyStatusLabel(property.status)}</dd>
          </div>
          {location && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </dt>
              <dd className="mt-0.5">{location}</dd>
            </div>
          )}
          {property.description && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                {property.description}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prospects
            </dt>
            <dd className="mt-0.5">{prospects.length}</dd>
          </div>
        </dl>
      </SidePanelContent>
    );
  }

  function renderDesktopPanel() {
    if (!activePanel) return null;

    if (activePanel === "attachments") {
      return <AttachmentsPanel {...attachmentProps} />;
    }

    if (activePanel === "activity") {
      return (
        <SidePanel title="Activity" onClose={closePanel} bodyClassName="p-0">
          <CompactActivityFeed activities={activities} />
        </SidePanel>
      );
    }

    return (
      <SidePanel title="Property details" onClose={closePanel}>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </dt>
            <dd className="mt-0.5 capitalize">{propertyStatusLabel(property.status)}</dd>
          </div>
          {location && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </dt>
              <dd className="mt-0.5">{location}</dd>
            </div>
          )}
          {property.description && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                {property.description}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Prospects
            </dt>
            <dd className="mt-0.5">{prospects.length}</dd>
          </div>
        </dl>
      </SidePanel>
    );
  }

  function renderTabContent() {
    if (tab === "details") {
      return (
        <div className="space-y-4 p-4 text-sm">
          {property.description ? (
            <section>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </h2>
              <p className="whitespace-pre-wrap text-muted-foreground">{property.description}</p>
            </section>
          ) : (
            <p className="text-muted-foreground">No additional property details.</p>
          )}
          {location && (
            <section>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Location
              </h2>
              <p>{location}</p>
            </section>
          )}
        </div>
      );
    }

    return (
      <PropertyProspectsGrid
        prospects={prospects}
        contactLabels={contactLabels}
        indicators={indicators}
        selectedProspectId={selectedProspectId}
        onSelectProspect={setSelectedProspectId}
        canAddProspect={canEdit && isActive}
        propertyId={property.id}
      />
    );
  }

  function openUploadFlow() {
    setActivePanel("attachments");
    setUploadRequest((current) => current + 1);
  }

  return (
    <>
      <DetailLayout
        mobileToolbar
        main={
          <>
            <PropertyBreadcrumb propertyName={property.name} />
            <SheetHeader
              title={property.name}
              subtitle={location || undefined}
              meta={
                <>
                  <MetadataPill value={meta.prospectCount} label="Prospects on Sheet" />
                  <MetadataPill value={meta.contactCount} label="Contacts on Sheet" />
                  <MetadataPill value={meta.documentCount} label="Documents on Sheet" />
                  {canManage && (
                    <MetadataPill value={meta.editorCount} label="Assigned Editors" />
                  )}
                </>
              }
              actions={
                <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5">
                  {canManage && isActive && (
                    <div className="flex flex-col items-end gap-0.5">
                      <Button
                        type="button"
                        size="sm"
                        className="btn-share gap-1.5 px-3"
                        onClick={() => setShareOpen(true)}
                      >
                        <Share2Icon className="size-3.5" />
                        Share
                      </Button>
                      <SharedWithSummary editorCount={meta.editorCount} />
                    </div>
                  )}
                  {isActive && (
                    <CreateMenu
                      canCreateProspect={canEditProspect(profile)}
                      canCreateContact={canEditContact(profile)}
                      canUploadDocument={canUpload}
                      propertyId={property.id}
                      onUploadClick={openUploadFlow}
                    />
                  )}
                  <PropertyOverflowMenu
                    propertyId={property.id}
                    propertyName={property.name}
                    canEdit={canEdit && isActive}
                    canArchive={canArchive && isActive}
                  />
                </div>
              }
            />
            <PropertyDetailTabs active={tab} />
            <div className="min-h-0 flex-1 overflow-auto">{renderTabContent()}</div>
          </>
        }
        panel={isMobile ? null : renderDesktopPanel()}
        rail={
          <>
            <UtilityRail active={activePanel} onSelect={togglePanel} />
            <MobileUtilityBar active={activePanel} onSelect={togglePanel} />
          </>
        }
      />

      {isMobile && (
        <ResponsivePanel open={activePanel !== null} onClose={closePanel}>
          <div className="flex max-h-[85vh] flex-col overflow-hidden">{renderPanelContent()}</div>
        </ResponsivePanel>
      )}

      {canManage && (
        <>
          <SharePropertyDialog
            propertyId={property.id}
            propertyName={property.name}
            editors={editors}
            assignments={assignments}
            open={shareOpen}
            onOpenChange={setShareOpen}
            onManageAccess={() => {
              setShareOpen(false);
              setManageOpen(true);
            }}
          />
          <ManageAccessDialog
            propertyId={property.id}
            propertyName={property.name}
            editors={editors}
            assignments={assignments}
            orgUsers={orgUsers}
            open={manageOpen}
            onOpenChange={setManageOpen}
          />
        </>
      )}
    </>
  );
}
