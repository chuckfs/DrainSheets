"use server";

import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
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
