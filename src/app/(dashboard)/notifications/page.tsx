import { listOrgActivity } from "@/actions/activity";
import { requireProfile } from "@/lib/auth/guards";
import { formatActivityMessage, formatRelativeTime } from "@/lib/activity/format";
import { ActivityItem } from "@/components/activity/activity-item";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { SheetHeader } from "@/components/layout/sheet-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function NotificationsPage() {
  await requireProfile();
  const activity = await listOrgActivity(40);

  return (
    <ListPageShell
      header={
        <SheetHeader
          title="Notifications"
          subtitle="Recent activity across your organization."
        />
      }
    >
      {activity.length === 0 ? (
        <EmptyState
          title="No notifications"
          description="Activity from sheets and workspaces will appear here."
        />
      ) : (
        <div className="space-y-2 p-3">
          {activity.map((item) => (
            <ActivityItem
              key={item.id}
              message={formatActivityMessage(item, item.actor)}
              timestamp={formatRelativeTime(item.created_at)}
            />
          ))}
        </div>
      )}
    </ListPageShell>
  );
}
