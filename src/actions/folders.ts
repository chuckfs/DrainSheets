"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createFolderSchema, deleteFolderSchema } from "@/lib/validations/folder";
import { collectSubtreeFolderIds } from "@/lib/folders/subtree";
import type { Folder } from "@/types/domain";

export async function listFolders(workspaceId: string): Promise<Folder[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function nextFolderPosition(
  workspaceId: string,
  parentFolderId: string | null,
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("folders")
    .select("position")
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: false })
    .limit(1);

  query = parentFolderId
    ? query.eq("parent_folder_id", parentFolderId)
    : query.is("parent_folder_id", null);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.position ?? -1) + 1;
}

export async function createFolder(input: {
  workspaceId: string;
  name: string;
  parentFolderId?: string | null;
}): Promise<ActionResult<Folder>> {
  const profile = await requireProfile();
  const parsed = createFolderSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid folder");
  }

  const supabase = await createClient();
  const parentFolderId = parsed.data.parentFolderId ?? null;
  const position = await nextFolderPosition(parsed.data.workspaceId, parentFolderId);

  const { data: folder, error } = await supabase
    .from("folders")
    .insert({
      org_id: profile.org_id,
      workspace_id: parsed.data.workspaceId,
      parent_folder_id: parentFolderId,
      name: parsed.data.name.trim(),
      position,
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/workspaces/${parsed.data.workspaceId}`);

  return actionSuccess(folder);
}

export async function deleteFolder(
  folderId: string,
): Promise<ActionResult<{ workspaceId: string }>> {
  await requireProfile();
  const parsed = deleteFolderSchema.safeParse({ folderId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid folder");
  }

  const supabase = await createClient();
  const { data: folder, error: fetchError } = await supabase
    .from("folders")
    .select("id, workspace_id, name")
    .eq("id", parsed.data.folderId)
    .maybeSingle();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  if (!folder) {
    return actionError("Folder not found");
  }

  const { data: workspaceFolders, error: foldersError } = await supabase
    .from("folders")
    .select("id, parent_folder_id")
    .eq("workspace_id", folder.workspace_id);

  if (foldersError) {
    return actionError(foldersError.message);
  }

  const subtreeIds = Array.from(
    collectSubtreeFolderIds(folder.id, workspaceFolders ?? []),
  );

  const { error: sheetsError } = await supabase
    .from("sheets")
    .delete()
    .in("folder_id", subtreeIds);

  if (sheetsError) {
    return actionError(sheetsError.message);
  }

  const { error } = await supabase.from("folders").delete().eq("id", folder.id);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/workspaces/${folder.workspace_id}`);
  revalidatePath("/browse");

  return actionSuccess({ workspaceId: folder.workspace_id });
}
