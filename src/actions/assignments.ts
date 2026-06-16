"use server";

import { revalidatePath } from "next/cache";
import { actionError, type ActionResult } from "@/lib/action-result";
import { requireOwner, requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/domain";

export async function listPropertyAssignments(propertyId: string) {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("property_assignments")
    .select("id, user_id, profiles(id, name, email)")
    .eq("property_id", propertyId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    profiles: Array.isArray(row.profiles) ? row.profiles[0] ?? null : row.profiles,
  }));
}

export async function listEditors(): Promise<Profile[]> {
  await requireOwner();
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("org_id", profile.org_id)
    .eq("role", "editor")
    .eq("status", "active")
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function assignEditor(propertyId: string, userId: string): Promise<ActionResult> {
  await requireOwner();
  const supabase = await createClient();

  const { error } = await supabase.from("property_assignments").insert({
    property_id: propertyId,
    user_id: userId,
  });

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/properties/${propertyId}`);
  return { success: true };
}

export async function unassignEditor(propertyId: string, userId: string): Promise<ActionResult> {
  await requireOwner();
  const supabase = await createClient();

  const { error } = await supabase
    .from("property_assignments")
    .delete()
    .eq("property_id", propertyId)
    .eq("user_id", userId);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/properties/${propertyId}`);
  return { success: true };
}
