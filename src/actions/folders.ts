"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createFolderSchema } from "@/lib/validations/folder";
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
