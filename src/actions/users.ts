"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireOwner, requireProfile } from "@/lib/auth/guards";
import { getClientEnv } from "@/lib/env";
import { buildInviteUrl, generateInviteToken, hashInviteToken } from "@/lib/invitations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { inviteUserSchema, updateProfileSchema } from "@/lib/validations/auth";
import type { OrgRole, UserStatus, Profile } from "@/types/domain";

export type InviteFormState = ActionResult<{ inviteUrl: string }>;

function inviteError(message: string): InviteFormState {
  return { success: false, error: message };
}

function inviteSuccess(inviteUrl: string): InviteFormState {
  return { success: true, data: { inviteUrl } };
}

export async function updateProfile(
  _prevState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();

  const parsed = updateProfileSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid name");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ name: parsed.data.name })
    .eq("id", profile.id);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/settings");
  return actionSuccess();
}

export async function createInvitation(
  _prevState: InviteFormState | null,
  formData: FormData,
): Promise<InviteFormState> {
  const owner = await requireOwner();

  const parsed = inviteUserSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return inviteError(parsed.error.issues[0]?.message ?? "Invalid invitation");
  }

  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const supabase = await createClient();
  const { error } = await supabase.from("invitations").insert({
    org_id: owner.org_id,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
    invited_by: owner.id,
  });

  if (error) {
    return inviteError(error.message);
  }

  const env = getClientEnv();
  revalidatePath("/settings/users");

  return inviteSuccess(buildInviteUrl(token, env.NEXT_PUBLIC_APP_URL));
}

export async function updateUserRole(userId: string, role: OrgRole): Promise<ActionResult> {
  await requireOwner();

  if (role === "owner") {
    return actionError("Cannot assign owner role via invite management");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/settings/users");
  return actionSuccess();
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
): Promise<ActionResult> {
  const owner = await requireOwner();

  if (userId === owner.id) {
    return actionError("You cannot change your own account status");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/settings/users");
  return actionSuccess();
}

export type InvitationPreview = {
  email: string;
  role: OrgRole;
};

export async function getInvitationByToken(
  token: string | null,
): Promise<InvitationPreview | null> {
  if (!token) {
    return null;
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("invitations")
    .select("email, role, expires_at, accepted_at")
    .eq("token_hash", hashInviteToken(token))
    .maybeSingle();

  if (!data || data.accepted_at || new Date(data.expires_at) < new Date()) {
    return null;
  }

  return {
    email: data.email,
    role: data.role,
  };
}

export async function canBootstrapFirstUser(): Promise<boolean> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });

  if (error) {
    return false;
  }

  return count === 0;
}

export async function listOrgUsers() {
  const profile = await requireOwner();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, status, created_at")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function listPendingInvitations() {
  const profile = await requireOwner();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("id, email, role, expires_at, created_at")
    .eq("org_id", profile.org_id)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export type OrgUserSearchResult = Pick<Profile, "id" | "name" | "email" | "role">;

export async function searchOrgUsers(
  query: string,
  excludeIds: string[] = [],
): Promise<OrgUserSearchResult[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  let builder = supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("org_id", profile.org_id)
    .eq("status", "active")
    .neq("id", profile.id)
    .order("name", { ascending: true })
    .limit(20);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(`name.ilike.${term},email.ilike.${term}`);
  }

  const { data, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  const excluded = new Set(excludeIds);
  return (data ?? []).filter((user) => !excluded.has(user.id));
}
