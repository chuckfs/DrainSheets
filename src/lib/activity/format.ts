import type { Activity } from "@/types/domain";

type ActivityProfile = {
  name: string;
} | null;

export type ActivityWithProfile = Activity & {
  profiles: ActivityProfile;
};

function metadataString(metadata: Activity["metadata"], key: string): string | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function formatActivityMessage(activity: ActivityWithProfile): string {
  const user = activity.profiles?.name ?? "Someone";
  const meta = activity.metadata;

  switch (activity.entity_type) {
    case "property": {
      const name = metadataString(meta, "name") ?? "a property";
      if (activity.action === "created") return `${user} created Property “${name}”`;
      if (activity.action === "updated") return `${user} updated Property “${name}”`;
      if (activity.action === "archived") return `${user} archived Property “${name}”`;
      if (activity.action === "email_sent") {
        const subject = metadataString(meta, "subject");
        return subject
          ? `${user} sent an email update for Property “${name}” (${subject})`
          : `${user} sent an email update for Property “${name}”`;
      }
      break;
    }
    case "prospect": {
      const name = metadataString(meta, "company_name") ?? "a prospect";
      if (activity.action === "created") return `${user} created Prospect “${name}”`;
      if (activity.action === "updated") return `${user} updated Prospect “${name}”`;
      if (activity.action === "email_sent") {
        const subject = metadataString(meta, "subject");
        return subject
          ? `${user} sent an email update for “${name}” (${subject})`
          : `${user} sent an email update for “${name}”`;
      }
      break;
    }
    case "contact": {
      const first = metadataString(meta, "first_name");
      const last = metadataString(meta, "last_name");
      const name = [first, last].filter(Boolean).join(" ") || "a contact";
      if (activity.action === "created") return `${user} created Contact “${name}”`;
      if (activity.action === "updated") return `${user} updated Contact “${name}”`;
      if (activity.action === "deleted") return `${user} deleted Contact “${name}”`;
      break;
    }
    case "document": {
      const name = metadataString(meta, "file_name") ?? "a document";
      if (activity.action === "uploaded") return `${user} uploaded Document “${name}”`;
      if (activity.action === "downloaded") return `${user} downloaded Document “${name}”`;
      if (activity.action === "viewed") return `${user} viewed Document “${name}”`;
      if (activity.action === "deleted") return `${user} deleted Document “${name}”`;
      break;
    }
    case "note": {
      if (activity.action === "created") return `${user} added a Note`;
      if (activity.action === "updated") return `${user} updated a Note`;
      if (activity.action === "deleted") return `${user} deleted a Note`;
      break;
    }
  }

  const entity = activity.entity_type.replace("_", " ");
  return `${user} ${activity.action} ${entity}`;
}

export function formatActivityEntityLabel(entityType: string): string {
  return entityType.charAt(0).toUpperCase() + entityType.slice(1);
}
