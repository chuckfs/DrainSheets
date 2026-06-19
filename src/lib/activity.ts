import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

type LogActivityInput = {
  orgId: string;
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  workspaceId?: string | null;
  sheetId?: string | null;
  rowId?: string | null;
  metadata?: Record<string, Json | undefined>;
};

export async function logActivity(input: LogActivityInput) {
  const admin = createAdminClient();

  const { error } = await admin.from("activity").insert({
    org_id: input.orgId,
    actor_id: input.actorId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    workspace_id: input.workspaceId ?? null,
    sheet_id: input.sheetId ?? null,
    row_id: input.rowId ?? null,
    action: input.action,
    metadata: (input.metadata ?? {}) as Json,
  });

  if (error) {
    console.error("Failed to log activity:", error.message);
  }
}
