import type { ActivityWithProfile } from "@/lib/activity/format";
import {
  formatActivityEntityLabel,
  formatActivityMessage,
} from "@/lib/activity/format";
import { formatCompactTime } from "@/lib/format-relative-time";

function activityHeadline(activity: ActivityWithProfile): string {
  const entity = formatActivityEntityLabel(activity.entity_type);
  const action = activity.action;

  if (activity.entity_type === "note" && action === "created") return "Note added";
  if (activity.entity_type === "document" && action === "uploaded") return "Document uploaded";
  if (activity.entity_type === "contact" && action === "updated") return "Contact updated";
  if (activity.entity_type === "contact" && action === "created") return "Contact added";
  if (activity.entity_type === "prospect" && action === "updated") return "Status changed";

  return `${entity} ${action}`;
}

export function ActivityTimeline({
  activities,
  title = "Recent activity",
  emptyMessage = "No recent activity yet.",
}: {
  activities: ActivityWithProfile[];
  title?: string;
  emptyMessage?: string;
}) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="border-b bg-muted/40 px-3 py-1.5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
      </div>
      {activities.length === 0 ? (
        <p className="px-3 py-8 text-center text-xs text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ol className="relative space-y-0 px-3 py-2">
          {activities.map((activity, index) => (
            <li key={activity.id} className="relative flex gap-3 pb-4 last:pb-1">
              {index < activities.length - 1 && (
                <span
                  className="absolute top-2 left-[5px] h-[calc(100%-4px)] w-px bg-border"
                  aria-hidden
                />
              )}
              <span
                className="relative z-[1] mt-1.5 size-2.5 shrink-0 rounded-full border-2 border-primary bg-background"
                aria-hidden
              />
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-medium">{activityHeadline(activity)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {activity.profiles?.name ?? "Someone"} · {formatCompactTime(activity.created_at)}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {formatActivityMessage(activity)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
