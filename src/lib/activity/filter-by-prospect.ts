import type { ActivityWithProfile } from "@/lib/activity/format";

function metadataProspectId(activity: ActivityWithProfile): string | null {
  const meta = activity.metadata;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return null;
  }

  const value = (meta as Record<string, unknown>).prospect_id;
  return typeof value === "string" ? value : null;
}

export function activityBelongsToProspect(
  activity: ActivityWithProfile,
  prospectId: string,
): boolean {
  if (activity.entity_type === "prospect" && activity.entity_id === prospectId) {
    return true;
  }

  return metadataProspectId(activity) === prospectId;
}

export function filterActivitiesForProspect(
  activities: ActivityWithProfile[],
  prospectId: string,
): ActivityWithProfile[] {
  return activities.filter((activity) => activityBelongsToProspect(activity, prospectId));
}
