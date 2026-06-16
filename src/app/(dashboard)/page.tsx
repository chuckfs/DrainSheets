import { getRecentActivity } from "@/actions/activity";
import { getDashboardData } from "@/actions/dashboard";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { AssignedPropertiesCard } from "@/components/dashboard/assigned-properties-card";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentProspectsCard } from "@/components/dashboard/recent-prospects-card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireProfile } from "@/lib/auth/guards";
import { canCreateProperty } from "@/lib/permissions/property";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const [{ stats, assignedProperties, recentProspects, assignedTitle }, activities] =
    await Promise.all([getDashboardData(profile), getRecentActivity()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {profile.name}.</p>
        </div>
        {canCreateProperty(profile) && (
          <Link href="/properties/new" className={cn(buttonVariants())}>
            Create property
          </Link>
        )}
      </div>

      <DashboardStats stats={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AssignedPropertiesCard title={assignedTitle} properties={assignedProperties} />
        <RecentProspectsCard prospects={recentProspects} />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Recent activity</h2>
        <ActivityFeed activities={activities} />
      </div>
    </div>
  );
}
