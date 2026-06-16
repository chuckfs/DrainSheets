"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { actionError, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { canArchiveProperty, canCreateProperty } from "@/lib/permissions/property";
import { createClient } from "@/lib/supabase/server";
import { parsePropertyForm, propertyInputToRow } from "@/lib/validations/crm";
import type { Property, PropertyStatus } from "@/types/domain";

const PAGE_SIZE = 20;

export type PropertyListParams = {
  q?: string;
  status?: PropertyStatus | "all";
  sort?: "name" | "created_at" | "city";
  order?: "asc" | "desc";
  page?: number;
};

export async function listProperties(params: PropertyListParams = {}) {
  await requireProfile();
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const sort = params.sort ?? "name";
  const order = params.order ?? "asc";
  const ascending = order === "asc";

  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .order(sort, { ascending });

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  } else if (!params.status) {
    query = query.eq("status", "active");
  }

  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    query = query.or(`name.ilike.${term},city.ilike.${term},address.ilike.${term}`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    properties: (data ?? []) as Property[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export async function getProperty(id: string): Promise<Property | null> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase.from("properties").select("*").eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createProperty(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();

  if (!canCreateProperty(profile)) {
    return actionError("You do not have permission to create properties");
  }

  const parsed = parsePropertyForm(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid property");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({
      ...propertyInputToRow(parsed.data),
      org_id: profile.org_id,
      created_by: profile.id,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !data) {
    return actionError(error?.message ?? "Failed to create property");
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "property",
    entityId: data.id,
    propertyId: data.id,
    action: "created",
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/properties");
  revalidatePath("/");
  redirect(`/properties/${data.id}`);
}

export async function updateProperty(
  propertyId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = parsePropertyForm(formData);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid property");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update(propertyInputToRow(parsed.data))
    .eq("id", propertyId);

  if (error) {
    return actionError(error.message);
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "property",
    entityId: propertyId,
    propertyId,
    action: "updated",
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}

export async function archiveProperty(propertyId: string): Promise<ActionResult> {
  const profile = await requireProfile();

  if (!canArchiveProperty(profile)) {
    return actionError("You do not have permission to archive properties");
  }

  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("name")
    .eq("id", propertyId)
    .maybeSingle();

  const { error } = await supabase
    .from("properties")
    .update({ status: "archived" })
    .eq("id", propertyId);

  if (error) {
    return actionError(error.message);
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "property",
    entityId: propertyId,
    propertyId,
    action: "archived",
    metadata: { name: property?.name },
  });

  revalidatePath("/properties");
  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/");
  return { success: true };
}

export async function getPropertyCount(status?: PropertyStatus) {
  await requireProfile();
  const supabase = await createClient();

  let query = supabase.from("properties").select("*", { count: "exact", head: true });
  if (status) {
    query = query.eq("status", status);
  }

  const { count, error } = await query;
  if (error) {
    return 0;
  }
  return count ?? 0;
}
