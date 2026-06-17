import type { ActivityWithProfile } from "@/lib/activity/format";
import {
  formatActivityEntityLabel,
  formatActivityMessage,
} from "@/lib/activity/format";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridCell,
  SmartsheetGridEmpty,
  SmartsheetGridHead,
  SmartsheetGridHeader,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";

export function CompactActivityFeed({ activities }: { activities: ActivityWithProfile[] }) {
  return (
    <section>
      <div className="border-x border-t bg-muted/40 px-2 py-1.5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recent activity
        </h2>
      </div>
      {activities.length === 0 ? (
        <SmartsheetGridEmpty message="No recent activity yet." />
      ) : (
        <SmartsheetGrid className="border-t-0">
          <SmartsheetGridHeader>
            <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
              <SmartsheetGridHead>Activity</SmartsheetGridHead>
              <SmartsheetGridHead className="w-28">When</SmartsheetGridHead>
            </SmartsheetGridRow>
          </SmartsheetGridHeader>
          <SmartsheetGridBody>
            {activities.map((activity) => (
              <SmartsheetGridRow key={activity.id}>
                <SmartsheetGridCell>
                  <p className="truncate text-[13px]">{formatActivityMessage(activity)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {activity.profiles?.name ?? "Someone"} ·{" "}
                    {formatActivityEntityLabel(activity.entity_type)}
                  </p>
                </SmartsheetGridCell>
                <SmartsheetGridCell className="text-muted-foreground">
                  {formatRelativeTime(activity.created_at)}
                </SmartsheetGridCell>
              </SmartsheetGridRow>
            ))}
          </SmartsheetGridBody>
        </SmartsheetGrid>
      )}
    </section>
  );
}
