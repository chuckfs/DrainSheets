"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ActivityWithProfile } from "@/lib/activity/format";
import type { ContactWithProspect } from "@/actions/contacts";
import type { DocumentWithRelations } from "@/actions/documents";
import type { NoteWithAuthor } from "@/actions/notes";
import type { ProspectWithProperty } from "@/actions/prospects";
import { CompactActivityFeed } from "@/components/dashboard/compact-activity-feed";
import {
  AttachmentsPanel,
  AttachmentsPanelContent,
  SidePanel,
  SidePanelContent,
} from "@/components/layout/attachments-panel";
import { DetailLayout } from "@/components/layout/detail-layout";
import { CreateMenu } from "@/components/layout/create-menu";
import { MobileUtilityBar } from "@/components/layout/mobile-utility-bar";
import { ResponsivePanel } from "@/components/layout/responsive-panel";
import { SheetHeader } from "@/components/layout/sheet-header";
import { UtilityRail } from "@/components/layout/utility-rail";
import { ProspectContactsGrid } from "@/components/prospects/prospect-contacts-grid";
import {
  ProspectBreadcrumb,
  ProspectDetailTabs,
  type ProspectDetailTab,
} from "@/components/prospects/prospect-detail-tabs";
import { SendUpdateButton, SendUpdateDialog } from "@/components/email/send-update-dialog";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-media-query";
import { useWorkspacePanel } from "@/hooks/use-workspace-panel";
import { canDeleteContact, canEditContact } from "@/lib/permissions/contact";
import { cn } from "@/lib/utils";
import type { Profile, Property } from "@/types/domain";

function parseTab(value: string | null): ProspectDetailTab {
  if (value === "details") return "details";
  return "grid";
}

export function ProspectDetailView({
  prospect,
  property,
  contacts,
  documents,
  notes,
  activities,
  profile,
  canUpload,
}: {
  prospect: ProspectWithProperty;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state" | "description">;
  contacts: ContactWithProspect[];
  documents: DocumentWithRelations[];
  notes: NoteWithAuthor[];
  activities: ActivityWithProfile[];
  profile: Profile;
  canUpload: boolean;
}) {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));
  const isMobile = useIsMobile();

  const { activePanel, setActivePanel, togglePanel, closePanel } = useWorkspacePanel();
  const [uploadRequest, setUploadRequest] = useState(0);
  const [sendUpdateOpen, setSendUpdateOpen] = useState(false);

  const propertyId = property.id;
  const propertyName = property.name;
  const canEdit = canEditContact(profile);
  const canDelete = canDeleteContact(profile);

  const attachmentProps = {
    propertyId,
    documents,
    notes,
    prospects: [prospect],
    profile,
    canUpload,
    selectedProspectId: prospect.id,
    selectedProspectName: prospect.company_name,
    selectedProspectCategory: prospect.category,
    selectedRowLabel: prospect.company_name,
    onClose: closePanel,
    variant: "prospect" as const,
    uploadRequest,
  };

  function openUploadFlow() {
    setActivePanel("attachments");
    setUploadRequest((current) => current + 1);
  }

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
      <SidePanelContent title="Row details" onClose={closePanel}>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Use
            </dt>
            <dd className="mt-0.5">{prospect.category ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </dt>
            <dd className="mt-0.5 capitalize">{prospect.status ?? "—"}</dd>
          </div>
          {prospect.website && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Website
              </dt>
              <dd className="mt-0.5">
                <a
                  href={prospect.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline"
                >
                  {prospect.website}
                </a>
              </dd>
            </div>
          )}
          {prospect.comments && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Comments
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                {prospect.comments}
              </dd>
            </div>
          )}
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
      <SidePanel title="Row details" onClose={closePanel}>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Use
            </dt>
            <dd className="mt-0.5">{prospect.category ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </dt>
            <dd className="mt-0.5 capitalize">{prospect.status ?? "—"}</dd>
          </div>
          {prospect.website && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Website
              </dt>
              <dd className="mt-0.5">
                <a
                  href={prospect.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link hover:underline"
                >
                  {prospect.website}
                </a>
              </dd>
            </div>
          )}
          {prospect.comments && (
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Comments
              </dt>
              <dd className="mt-0.5 whitespace-pre-wrap text-muted-foreground">
                {prospect.comments}
              </dd>
            </div>
          )}
        </dl>
      </SidePanel>
    );
  }

  function renderTabContent() {
    if (tab === "details") {
      return (
        <div className="space-y-4 p-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Use
              </dt>
              <dd className="mt-0.5">{prospect.category ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </dt>
              <dd className="mt-0.5 capitalize">{prospect.status ?? "—"}</dd>
            </div>
          </dl>
          {prospect.website && (
            <section>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Website
              </h2>
              <a
                href={prospect.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-link hover:underline"
              >
                {prospect.website}
              </a>
            </section>
          )}
          {prospect.comments && (
            <section>
              <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Comments
              </h2>
              <p className="whitespace-pre-wrap text-muted-foreground">{prospect.comments}</p>
            </section>
          )}
        </div>
      );
    }

    return (
      <ProspectContactsGrid
        contacts={contacts}
        prospectId={prospect.id}
        canEdit={canEdit}
        canDelete={canDelete}
        canAddContact={canEdit}
      />
    );
  }

  return (
    <>
      <DetailLayout
        mobileToolbar
        main={
          <>
            <ProspectBreadcrumb
              propertyId={propertyId}
              propertyName={propertyName}
              prospectName={prospect.company_name}
            />
            <SheetHeader
              eyebrow="Row Workspace"
              title={prospect.company_name}
              subtitle={propertyName}
              actions={
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {prospect.status && (
                    <Badge variant="outline" className="h-6 text-xs font-normal capitalize">
                      {prospect.status}
                    </Badge>
                  )}
                  <SendUpdateButton onClick={() => setSendUpdateOpen(true)} />
                  <CreateMenu
                    canCreateContact={canEdit}
                    canUploadDocument={canUpload}
                    propertyId={propertyId}
                    prospectId={prospect.id}
                    onUploadClick={openUploadFlow}
                  />
                  {canEdit && (
                    <Link
                      href={`/prospects/${prospect.id}/edit`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Edit
                    </Link>
                  )}
                </div>
              }
            />
            <ProspectDetailTabs active={tab} />
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

      <SendUpdateDialog
        open={sendUpdateOpen}
        onOpenChange={setSendUpdateOpen}
        property={property}
        prospect={prospect}
        documents={documents}
        profile={profile}
      />
    </>
  );
}
