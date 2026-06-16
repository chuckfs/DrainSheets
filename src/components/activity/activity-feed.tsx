import type { ActivityWithProfile } from "@/lib/activity/format";
import {
  formatActivityEntityLabel,
  formatActivityMessage,
} from "@/lib/activity/format";

export function ActivityFeed({ activities }: { activities: ActivityWithProfile[] }) {
  if (activities.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No recent activity yet.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <ul className="divide-y">
        {activities.map((activity) => (
          <li key={activity.id} className="px-4 py-3 text-sm">
            <p>{formatActivityMessage(activity)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {activity.profiles?.name ?? "Someone"} ·{" "}
              {formatActivityEntityLabel(activity.entity_type)} ·{" "}
              {new Date(activity.created_at).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
