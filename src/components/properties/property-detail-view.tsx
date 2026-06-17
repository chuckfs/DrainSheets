"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { ChevronDownIcon, PlusIcon, Share2Icon } from "lucide-react";
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
import { MobileUtilityBar } from "@/components/layout/mobile-utility-bar";
import { ResponsivePanel } from "@/components/layout/responsive-panel";
import { SheetHeader } from "@/components/layout/sheet-header";
import { UtilityRail, type UtilityPanel } from "@/components/layout/utility-rail";
import { ArchivePropertyButton } from "@/components/properties/archive-property-button";
import { ManageAccessDialog } from "@/components/properties/manage-access-dialog";
import {
  PropertyBreadcrumb,
  PropertyDetailTabs,
  type PropertyDetailTab,
} from "@/components/properties/property-detail-tabs";
import { PropertyProspectsGrid } from "@/components/properties/property-prospects-grid";
import { SharePropertyDialog } from "@/components/properties/share-property-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotesSection } from "@/components/notes/notes-section";
import { useIsMobile } from "@/hooks/use-media-query";
import type { ProspectIndicatorCounts } from "@/lib/prospects/indicators";
import { cn } from "@/lib/utils";
import {
  canArchiveProperty,
  canEditProperty,
  canManageAssignments,
  propertyStatusLabel,
} from "@/lib/permissions/property";
import type { Profile, Property, UserRole } from "@/types/domain";

type Editor = { id: string; name: string; email: string };
type Assignment = {
  id: string;
  user_id: string;
  profiles: { id: string; name: string; email: string } | null;
};
type OrgUser = { id: string; name: string; email: string; role: UserRole };

function parseTab(value: string | null): PropertyDetailTab {
  if (value === "details" || value === "activity") return value;
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
}) {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const isMobile = useIsMobile();

  const [activePanel, setActivePanel] = useState<UtilityPanel | null>("attachments");
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const canManage = canManageAssignments(profile);
  const isActive = property.status === "active";
  const location = [property.address, property.city, property.state].filter(Boolean).join(", ");

  const selectedRowLabel = useMemo(() => {
    if (!selectedProspectId) return null;
    const index = prospects.findIndex((prospect) => prospect.id === selectedProspectId);
    const prospect = prospects[index];
    if (!prospect || index < 0) return null;
    return `Row ${index + 1}: ${prospect.company_name}`;
  }, [prospects, selectedProspectId]);

  useEffect(() => {
    if (selectedProspectId) {
      setActivePanel("attachments");
    }
  }, [selectedProspectId]);

  function togglePanel(panel: UtilityPanel) {
    setActivePanel((current) => (current === panel ? null : panel));
  }

  function closePanel() {
    setActivePanel(null);
  }

  const attachmentProps = {
    propertyId: property.id,
    documents,
    notes,
    prospects,
    profile,
    canUpload: canUpload && isActive,
    selectedProspectId,
    selectedRowLabel,
    onClose: closePanel,
    variant: "property" as const,
  };

  function renderPanelContent() {
    if (!activePanel) return null;

    if (activePanel === "attachments") {
      return <AttachmentsPanelContent {...attachmentProps} />;
    }

    if (activePanel === "notes") {
      return (
        <SidePanelContent title="Notes" onClose={closePanel}>
          <NotesSection notes={notes} profile={profile} propertyId={property.id} />
        </SidePanelContent>
      );
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

    if (activePanel === "notes") {
      return (
        <SidePanel title="Notes" onClose={closePanel}>
          <NotesSection notes={notes} profile={profile} propertyId={property.id} />
        </SidePanel>
      );
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

    if (tab === "activity") {
      return (
        <div className="p-2">
          <CompactActivityFeed activities={activities} />
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
        canAddProspect={canEditProperty(profile) && isActive}
        propertyId={property.id}
      />
    );
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
              actions={
                <div className="flex max-w-full flex-wrap items-center justify-end gap-1.5">
                  <Badge
                    variant={property.status === "archived" ? "secondary" : "outline"}
                    className="h-6 text-xs font-normal"
                  >
                    {propertyStatusLabel(property.status)}
                  </Badge>
                  {canManage && isActive && (
                    <Button
                      type="button"
                      size="sm"
                      className="btn-share gap-1.5"
                      onClick={() => setShareOpen(true)}
                    >
                      <Share2Icon className="size-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </Button>
                  )}
                  {isActive && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(buttonVariants({ size: "sm", variant: "outline" }), "gap-1")}
                      >
                        <PlusIcon className="size-3.5" />
                        <span className="hidden sm:inline">Create</span>
                        <ChevronDownIcon className="size-3.5 opacity-60" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {canEditProperty(profile) && (
                          <DropdownMenuItem
                            render={<Link href={`/properties/${property.id}/prospects/new`} />}
                          >
                            Add prospect
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {canEditProperty(profile) && (
                    <Link
                      href={`/properties/${property.id}/edit`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Edit
                    </Link>
                  )}
                  {canArchiveProperty(profile) && isActive && (
                    <ArchivePropertyButton propertyId={property.id} propertyName={property.name} />
                  )}
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
