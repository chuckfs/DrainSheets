"use server";

import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Workspace } from "@/types/domain";

export async function listWorkspaces(): Promise<Workspace[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getDefaultWorkspace(): Promise<Workspace | null> {
  const workspaces = await listWorkspaces();
  return workspaces[0] ?? null;
}

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
