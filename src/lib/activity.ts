import { createAdminClient } from "@/lib/supabase/admin";

type LogActivityInput = {
  orgId: string;
  userId: string;
  entityType: "property" | "prospect" | "contact" | "document" | "note";
  entityId: string;
  propertyId?: string | null;
  action: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(input: LogActivityInput) {
  const admin = createAdminClient();

  const { error } = await admin.from("activity").insert({
    org_id: input.orgId,
    user_id: input.userId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    property_id: input.propertyId ?? null,
    action: input.action,
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("Failed to log activity:", error.message);
  }
}
