"use server";

import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type ActivityAction =
  | "created"
  | "updated"
  | "deleted"
  | "renamed"
  | "moved"
  | "uploaded"
  | "granted"
  | "revoked"
  | "completed";

export type ActivityEntityType =
  | "row"
  | "column"
  | "note"
  | "document"
  | "share"
  | "sheet"
  | "import";

export type LogActivityInput = {
  entityType: ActivityEntityType;
  entityId: string;
  action: ActivityAction;
  metadata?: Record<string, Json | undefined>;
  workspaceId?: string | null;
  sheetId?: string | null;
  rowId?: string | null;
};

export async function logActivityEvent(input: LogActivityInput): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { error } = await supabase.rpc("log_activity", {
    p_org_id: profile.org_id,
    p_actor_id: profile.id,
    p_entity_type: input.entityType,
    p_entity_id: input.entityId,
    p_action: input.action,
    p_metadata: (input.metadata ?? {}) as Json,
    p_workspace_id: input.workspaceId ?? undefined,
    p_sheet_id: input.sheetId ?? undefined,
    p_row_id: input.rowId ?? undefined,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getSheetActivityContext(sheetId: string): Promise<{
  workspaceId: string;
  sheetName: string;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sheets")
    .select("workspace_id, name")
    .eq("id", sheetId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    workspaceId: data.workspace_id,
    sheetName: data.name,
  };
}
