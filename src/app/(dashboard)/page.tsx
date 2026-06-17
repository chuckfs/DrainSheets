import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { getRecentActivity } from "@/actions/activity";
import { getDashboardData } from "@/actions/dashboard";
import { CompactActivityFeed } from "@/components/dashboard/compact-activity-feed";
import { DashboardPropertiesTable } from "@/components/dashboard/dashboard-properties-table";
import { DashboardProspectsTable } from "@/components/dashboard/dashboard-prospects-table";
import { KpiStrip } from "@/components/dashboard/kpi-strip";
import { SheetHeader } from "@/components/layout/sheet-header";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { requireProfile } from "@/lib/auth/guards";
import { canCreateProperty } from "@/lib/permissions/property";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
            canCreateProperty(profile) ? (
              <Link
                href="/properties/new"
                className={cn(buttonVariants({ size: "sm" }), "btn-share gap-1.5")}
              >
                <PlusIcon className="size-3.5" />
                Create
              </Link>
            ) : undefined
          }
        />
      }
      toolbar={<KpiStrip stats={stats} />}
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        <DashboardPropertiesTable title={assignedTitle} properties={assignedProperties} />
        <DashboardProspectsTable prospects={recentProspects} />
      </div>
      <div className="mt-4">
        <CompactActivityFeed activities={activities} />
      </div>
    </ListPageShell>
  );
}
