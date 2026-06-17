import { getRecentActivity } from "@/actions/activity";
import { getDashboardData } from "@/actions/dashboard";
import { CompactActivityFeed } from "@/components/dashboard/compact-activity-feed";
import { DashboardPropertiesTable } from "@/components/dashboard/dashboard-properties-table";
import { DashboardProspectsTable } from "@/components/dashboard/dashboard-prospects-table";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
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

function dashboardSubtitle(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [{ stats, assignedProperties, recentProspects, assignedTitle }, activities] =
    await Promise.all([getDashboardData(profile), getRecentActivity()]);

  return (
    <ListPageShell
      header={
        <SheetHeader
          title="Home"
          subtitle={dashboardSubtitle()}
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
      toolbar={<KpiStrip stats={stats} />}
    >
      <div className="flex flex-col gap-2 lg:flex-row">
        <DashboardPropertiesTable title={assignedTitle} properties={assignedProperties} />
        <DashboardProspectsTable prospects={recentProspects} />
      </div>
      <div className="mt-2">
        <CompactActivityFeed activities={activities} />
      </div>
    </ListPageShell>
  );
}
