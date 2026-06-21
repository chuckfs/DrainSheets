"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { canCreateWorkspace } from "@/lib/permissions/sheet";
import { createClient } from "@/lib/supabase/server";
import { createWorkspaceSchema, deleteWorkspaceSchema } from "@/lib/validations/workspace";
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

export async function createWorkspace(input: {
  name: string;
  color?: string | null;
  icon?: string | null;
}): Promise<ActionResult<Workspace>> {
  const profile = await requireProfile();

  if (!canCreateWorkspace(profile)) {
    return actionError("You do not have permission to create workspaces");
  }

  const parsed = createWorkspaceSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid workspace");
  }

  const supabase = await createClient();

  const { data: workspace, error } = await supabase
    .from("workspaces")
    .insert({
      org_id: profile.org_id,
      name: parsed.data.name.trim(),
      color: parsed.data.color ?? null,
      icon: parsed.data.icon ?? null,
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/");
  revalidatePath(`/workspaces/${workspace.id}`);

  return actionSuccess(workspace);
}

export async function deleteWorkspace(workspaceId: string): Promise<ActionResult> {
  await requireProfile();
  const parsed = deleteWorkspaceSchema.safeParse({ workspaceId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid workspace");
  }

  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("workspaces")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return actionError(countError.message);
  }

  if ((count ?? 0) <= 1) {
    return actionError("You cannot delete your only workspace");
  }

  const { data: existing, error: fetchError } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", parsed.data.workspaceId)
    .maybeSingle();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  if (!existing) {
    return actionError("Workspace not found");
  }

  const { error } = await supabase.from("workspaces").delete().eq("id", existing.id);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/");
  revalidatePath("/browse");
  revalidatePath(`/workspaces/${existing.id}`);

  return actionSuccess(undefined);
}
