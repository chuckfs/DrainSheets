"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { logActivityEvent } from "@/lib/activity/log-event";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { isSameSheetFolder } from "@/lib/folders/move-validation";
import { deleteSheetSchema, moveSheetSchema } from "@/lib/validations/sheet";
import type { Sheet } from "@/types/domain";

async function nextSheetPosition(
  workspaceId: string,
  folderId: string | null,
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("sheets")
    .select("position")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("position", { ascending: false })
    .limit(1);

  query = folderId ? query.eq("folder_id", folderId) : query.is("folder_id", null);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.position ?? -1) + 1;
}

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

export async function moveSheet(input: {
  sheetId: string;
  targetFolderId: string | null;
}): Promise<ActionResult<Sheet>> {
  await requireProfile();
  const parsed = moveSheetSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid move");
  }

  const supabase = await createClient();
  const { data: sheet, error: fetchError } = await supabase
    .from("sheets")
    .select("*")
    .eq("id", parsed.data.sheetId)
    .maybeSingle();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  if (!sheet) {
    return actionError("Sheet not found");
  }

  const targetFolderId = parsed.data.targetFolderId;

  if (isSameSheetFolder(sheet.folder_id, targetFolderId)) {
    return actionSuccess(sheet);
  }

  if (targetFolderId) {
    const { data: targetFolder, error: targetError } = await supabase
      .from("folders")
      .select("id, workspace_id")
      .eq("id", targetFolderId)
      .maybeSingle();

    if (targetError) {
      return actionError(targetError.message);
    }

    if (!targetFolder) {
      return actionError("Target folder not found");
    }

    if (targetFolder.workspace_id !== sheet.workspace_id) {
      return actionError("Target folder must be in the same workspace");
    }
  }

  const position = await nextSheetPosition(sheet.workspace_id, targetFolderId);

  const { data: updated, error } = await supabase
    .from("sheets")
    .update({
      folder_id: targetFolderId,
      position,
    })
    .eq("id", sheet.id)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/workspaces/${sheet.workspace_id}`);
  revalidatePath(`/sheets/${sheet.id}`);
  revalidatePath("/browse");

  return actionSuccess(updated);
}
