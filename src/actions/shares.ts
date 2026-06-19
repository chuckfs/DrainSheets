"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { logActivityEvent } from "@/lib/activity/log-event";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  createShareSchema,
  revokeShareSchema,
  updateShareRoleSchema,
} from "@/lib/validations/share";
import type { AccessRole, Profile, Share, ShareResourceType } from "@/types/domain";

export type ShareWithGrantee = Share & {
  grantee: Pick<Profile, "id" | "name" | "email" | "role">;
  accessLabel: "Direct Access";
};

function revalidateResourcePaths(resourceType: ShareResourceType, resourceId: string) {
  if (resourceType === "workspace") {
    revalidatePath(`/workspaces/${resourceId}`);
    revalidatePath("/");
  } else if (resourceType === "sheet") {
    revalidatePath(`/sheets/${resourceId}`);
  } else if (resourceType === "folder") {
    revalidatePath("/");
  }
}

export async function listShares(
  resourceType: ShareResourceType,
  resourceId: string,
): Promise<ShareWithGrantee[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("shares")
    .select(
      `
      *,
      grantee:profiles!shares_grantee_id_fkey (
        id,
        name,
        email,
        role
      )
    `,
    )
    .eq("resource_type", resourceType)
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((share) => ({
    ...share,
    grantee: share.grantee as ShareWithGrantee["grantee"],
    accessLabel: "Direct Access" as const,
  }));
}

export async function grantShare(
  resourceType: ShareResourceType,
  resourceId: string,
  granteeId: string,
  role: AccessRole,
): Promise<ActionResult<Share>> {
  const profile = await requireProfile();
  const parsed = createShareSchema.safeParse({
    resourceType,
    resourceId,
    granteeId,
    role,
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid share");
  }

  if (granteeId === profile.id) {
    return actionError("You cannot share with yourself");
  }

  const supabase = await createClient();
  const { data: share, error } = await supabase
    .from("shares")
    .insert({
      org_id: profile.org_id,
      grantee_id: granteeId,
      resource_type: resourceType,
      resource_id: resourceId,
      role: parsed.data.role,
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  const { data: grantee } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", granteeId)
    .maybeSingle();

  await logActivityEvent({
    entityType: "share",
    entityId: share.id,
    action: "granted",
    metadata: {
      grantee_name: grantee?.name ?? "User",
      role: parsed.data.role,
      resource_type: resourceType,
    },
    sheetId: resourceType === "sheet" ? resourceId : undefined,
    workspaceId: resourceType === "workspace" ? resourceId : undefined,
  });

  revalidateResourcePaths(resourceType, resourceId);
  return actionSuccess(share);
}

export async function updateShareRole(
  shareId: string,
  role: AccessRole,
): Promise<ActionResult<Share>> {
  await requireProfile();
  const parsed = updateShareRoleSchema.safeParse({ shareId, role });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid share role");
  }

  const supabase = await createClient();
  const { data: share, error } = await supabase
    .from("shares")
    .update({ role: parsed.data.role })
    .eq("id", shareId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidateResourcePaths(share.resource_type, share.resource_id);
  return actionSuccess(share);
}

export async function revokeShare(shareId: string): Promise<ActionResult> {
  await requireProfile();
  const parsed = revokeShareSchema.safeParse({ shareId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid share");
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("shares")
    .select("resource_type, resource_id, grantee_id, role")
    .eq("id", shareId)
    .single();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  const { data: grantee } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", existing.grantee_id)
    .maybeSingle();

  const { error } = await supabase.from("shares").delete().eq("id", shareId);

  if (error) {
    return actionError(error.message);
  }

  await logActivityEvent({
    entityType: "share",
    entityId: shareId,
    action: "revoked",
    metadata: {
      grantee_name: grantee?.name ?? "User",
      role: existing.role,
      resource_type: existing.resource_type,
    },
    sheetId: existing.resource_type === "sheet" ? existing.resource_id : undefined,
    workspaceId: existing.resource_type === "workspace" ? existing.resource_id : undefined,
  });

  revalidateResourcePaths(existing.resource_type, existing.resource_id);
  return actionSuccess();
}
