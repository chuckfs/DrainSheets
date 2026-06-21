"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { logActivityEvent } from "@/lib/activity/log-event";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { deleteSheetSchema } from "@/lib/validations/sheet";
import type { Sheet } from "@/types/domain";

export async function listSheets(workspaceId: string): Promise<Sheet[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sheets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getSheet(sheetId: string): Promise<Sheet | null> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase.from("sheets").select("*").eq("id", sheetId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteSheet(
  sheetId: string,
): Promise<ActionResult<{ workspaceId: string }>> {
  await requireProfile();
  const parsed = deleteSheetSchema.safeParse({ sheetId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid sheet");
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("sheets")
    .select("id, workspace_id, name")
    .eq("id", parsed.data.sheetId)
    .maybeSingle();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  if (!existing) {
    return actionError("Sheet not found");
  }

  try {
    await logActivityEvent({
      entityType: "sheet",
      entityId: existing.id,
      action: "deleted",
      workspaceId: existing.workspace_id,
      sheetId: existing.id,
      metadata: { name: existing.name },
    });
  } catch {
    // Activity logging must not block delete.
  }

  const { error } = await supabase.from("sheets").delete().eq("id", existing.id);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/workspaces/${existing.workspace_id}`);
  revalidatePath(`/sheets/${existing.id}`);
  revalidatePath("/browse");

  return actionSuccess({ workspaceId: existing.workspace_id });
}
