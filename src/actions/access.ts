"use server";

import { requireProfile } from "@/lib/auth/guards";
import {
  buildAccessContext,
  type AccessContext,
  type AccessSource,
} from "@/lib/access/effective-role";
import { hasOrgRole } from "@/lib/permissions/roles";
import { createClient } from "@/lib/supabase/server";
import type { AccessRole } from "@/types/domain";

async function getFolderAncestorIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  folderId: string,
): Promise<string[]> {
  const { data, error } = await supabase.rpc("folder_ancestor_ids", {
    start_folder_id: folderId,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

async function getShareCandidatesForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  options: {
    sheetId?: string;
    workspaceId?: string;
    folderId?: string;
    folderAncestorIds?: string[];
  },
): Promise<Array<{ role: AccessRole; source: AccessSource }>> {
  const { data: shares, error } = await supabase
    .from("shares")
    .select("role, resource_type, resource_id")
    .eq("grantee_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const candidates: Array<{ role: AccessRole; source: AccessSource }> = [];

  for (const share of shares ?? []) {
    if (options.sheetId && share.resource_type === "sheet" && share.resource_id === options.sheetId) {
      candidates.push({ role: share.role, source: "sheet" });
    }

    if (
      options.workspaceId &&
      share.resource_type === "workspace" &&
      share.resource_id === options.workspaceId
    ) {
      candidates.push({ role: share.role, source: "workspace" });
    }

    if (
      options.folderId &&
      share.resource_type === "folder" &&
      share.resource_id === options.folderId
    ) {
      candidates.push({ role: share.role, source: "folder" });
    }

    if (
      options.folderAncestorIds &&
      share.resource_type === "folder" &&
      options.folderAncestorIds.includes(share.resource_id)
    ) {
      candidates.push({ role: share.role, source: "folder" });
    }
  }

  return candidates;
}

export async function getWorkspaceAccessContext(workspaceId: string): Promise<AccessContext> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isOrgAdmin = hasOrgRole(profile.role, "admin");

  const candidates = await getShareCandidatesForUser(supabase, profile.id, {
    workspaceId,
  });

  return buildAccessContext(candidates, isOrgAdmin);
}

export async function getSheetAccessContext(sheetId: string): Promise<AccessContext> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isOrgAdmin = hasOrgRole(profile.role, "admin");

  const { data: sheet, error } = await supabase
    .from("sheets")
    .select("workspace_id, folder_id")
    .eq("id", sheetId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!sheet) {
    return buildAccessContext([], false);
  }

  const folderAncestorIds = sheet.folder_id
    ? await getFolderAncestorIds(supabase, sheet.folder_id)
    : [];

  const candidates = await getShareCandidatesForUser(supabase, profile.id, {
    sheetId,
    workspaceId: sheet.workspace_id,
    folderAncestorIds,
  });

  return buildAccessContext(candidates, isOrgAdmin);
}

export async function getFolderAccessContext(folderId: string): Promise<AccessContext> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isOrgAdmin = hasOrgRole(profile.role, "admin");

  const { data: folder, error } = await supabase
    .from("folders")
    .select("workspace_id")
    .eq("id", folderId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!folder) {
    return buildAccessContext([], false);
  }

  const folderAncestorIds = await getFolderAncestorIds(supabase, folderId);

  const candidates = await getShareCandidatesForUser(supabase, profile.id, {
    folderId,
    workspaceId: folder.workspace_id,
    folderAncestorIds,
  });

  return buildAccessContext(candidates, isOrgAdmin);
}
