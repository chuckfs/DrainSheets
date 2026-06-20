"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAccessRole } from "@/lib/permissions/roles";
import type { AccessRole } from "@/types/domain";

// Links may only grant content roles, never admin/owner.
const LINK_ROLES: AccessRole[] = ["viewer", "commenter", "editor"];

export type SheetShareLink = {
  id: string;
  sheet_id: string;
  token: string;
  role: AccessRole;
  is_active: boolean;
};

function isLinkRole(role: AccessRole): boolean {
  return LINK_ROLES.includes(role);
}

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

const LINK_COLUMNS = "id, sheet_id, token, role, is_active";

export async function getSheetShareLink(sheetId: string): Promise<SheetShareLink | null> {
  await requireProfile();
  const supabase = await createClient();
  const { data } = await supabase
    .from("sheet_share_links")
    .select(LINK_COLUMNS)
    .eq("sheet_id", sheetId)
    .maybeSingle();
  return data ? { ...data, role: data.role as AccessRole } : null;
}

export async function createSheetShareLink(
  sheetId: string,
  role: AccessRole,
): Promise<ActionResult<SheetShareLink>> {
  const profile = await requireProfile();
  if (!isLinkRole(role)) {
    return actionError("Links can only grant Viewer, Commenter, or Editor access");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sheet_share_links")
    .insert({
      sheet_id: sheetId,
      org_id: profile.org_id,
      token: generateToken(),
      role,
      created_by: profile.id,
    })
    .select(LINK_COLUMNS)
    .single();

  if (error) {
    return actionError(error.message);
  }
  revalidatePath(`/sheets/${sheetId}`);
  return actionSuccess({ ...data, role: data.role as AccessRole });
}

export async function updateSheetShareLink(
  sheetId: string,
  patch: { role?: AccessRole; isActive?: boolean },
): Promise<ActionResult<SheetShareLink>> {
  await requireProfile();
  if (patch.role && !isLinkRole(patch.role)) {
    return actionError("Links can only grant Viewer, Commenter, or Editor access");
  }

  const update: { role?: AccessRole; is_active?: boolean } = {};
  if (patch.role) update.role = patch.role;
  if (patch.isActive !== undefined) update.is_active = patch.isActive;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sheet_share_links")
    .update(update)
    .eq("sheet_id", sheetId)
    .select(LINK_COLUMNS)
    .single();

  if (error) {
    return actionError(error.message);
  }
  revalidatePath(`/sheets/${sheetId}`);
  return actionSuccess({ ...data, role: data.role as AccessRole });
}

export async function regenerateSheetShareLink(
  sheetId: string,
): Promise<ActionResult<SheetShareLink>> {
  await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sheet_share_links")
    .update({ token: generateToken() })
    .eq("sheet_id", sheetId)
    .select(LINK_COLUMNS)
    .single();

  if (error) {
    return actionError(error.message);
  }
  revalidatePath(`/sheets/${sheetId}`);
  return actionSuccess({ ...data, role: data.role as AccessRole });
}

/**
 * Redeem a share link: grant the current (logged-in, same-org) user the link's
 * role on the sheet. Uses the service role to bypass the admin-only shares RLS,
 * but only after validating login + org membership + active link. Never
 * downgrades an existing share.
 */
export async function redeemSheetShareLink(
  token: string,
): Promise<ActionResult<{ sheetId: string }>> {
  const profile = await requireProfile();
  const admin = createAdminClient();

  const { data: link } = await admin
    .from("sheet_share_links")
    .select("sheet_id, org_id, role, is_active")
    .eq("token", token)
    .eq("is_active", true)
    .maybeSingle();

  if (!link) {
    return actionError("This link is invalid or has been disabled.");
  }
  if (link.org_id !== profile.org_id) {
    return actionError("This link belongs to a different organization.");
  }

  const linkRole = link.role as AccessRole;

  const { data: existing } = await admin
    .from("shares")
    .select("id, role")
    .eq("grantee_id", profile.id)
    .eq("resource_type", "sheet")
    .eq("resource_id", link.sheet_id)
    .maybeSingle();

  if (existing) {
    // Only upgrade — never reduce an existing role.
    if (!hasAccessRole(existing.role as AccessRole, linkRole)) {
      const { error } = await admin
        .from("shares")
        .update({ role: linkRole })
        .eq("id", existing.id);
      if (error) {
        return actionError(error.message);
      }
    }
  } else {
    const { error } = await admin.from("shares").insert({
      org_id: link.org_id,
      grantee_id: profile.id,
      resource_type: "sheet",
      resource_id: link.sheet_id,
      role: linkRole,
      created_by: profile.id,
    });
    if (error) {
      return actionError(error.message);
    }
  }

  return actionSuccess({ sheetId: link.sheet_id });
}
