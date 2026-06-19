import type { Activity } from "@/types/domain";

type ActivityActor = {
  name: string;
};

function capitalize(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function metadataString(metadata: Activity["metadata"], key: string): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function formatActivityMessage(
  activity: Activity,
  actor: ActivityActor | null,
): string {
  const actorName = actor?.name ?? "Someone";
  const metadata = activity.metadata;

  switch (`${activity.entity_type}:${activity.action}`) {
    case "row:created":
      return `${actorName} created row${metadataString(metadata, "row_title") ? ` “${metadataString(metadata, "row_title")}”` : ""}`;
    case "row:updated":
      return `${actorName} updated ${metadataString(metadata, "column_label") ?? "a field"}${metadataString(metadata, "row_title") ? ` on ${metadataString(metadata, "row_title")}` : ""}`;
    case "row:deleted":
      return `${actorName} deleted a row`;
    case "column:created":
      return `${actorName} added column ${metadataString(metadata, "column_label") ?? ""}`.trim();
    case "column:renamed":
      return `${actorName} renamed column to ${metadataString(metadata, "column_label") ?? "a column"}`;
    case "column:moved":
      return `${actorName} moved column ${metadataString(metadata, "column_label") ?? ""}`.trim();
    case "column:deleted":
      return `${actorName} deleted column ${metadataString(metadata, "column_label") ?? ""}`.trim();
    case "note:created":
      return `${actorName} added a note`;
    case "note:updated":
      return `${actorName} updated a note`;
    case "note:deleted":
      return `${actorName} deleted a note`;
    case "document:uploaded":
      return `${actorName} uploaded ${metadataString(metadata, "file_name") ?? "a file"}`;
    case "document:deleted":
      return `${actorName} deleted ${metadataString(metadata, "file_name") ?? "a file"}`;
    case "share:granted":
      return `${actorName} granted ${capitalize(metadataString(metadata, "role") ?? "access")} access to ${metadataString(metadata, "grantee_name") ?? "a user"}`;
    case "share:revoked":
      return `${actorName} revoked access for ${metadataString(metadata, "grantee_name") ?? "a user"}`;
    case "sheet:created":
      return `${actorName} created sheet ${metadataString(metadata, "sheet_name") ?? ""}`.trim();
    case "import:completed":
      return `${actorName} completed import${metadataString(metadata, "row_count") ? ` (${metadataString(metadata, "row_count")} rows)` : ""}`;
    default:
      return `${actorName} ${activity.action} ${activity.entity_type}`;
  }
}

export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) {
    return "just now";
  }

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) {
    return `${diffHour}h ago`;
  }

  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) {
    return `${diffDay}d ago`;
  }

  return date.toLocaleDateString();
}
