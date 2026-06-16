"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { actionError, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { parseProspectForm, prospectInputToRow } from "@/lib/validations/crm";
import type { Prospect, ProspectStatus } from "@/types/domain";

const PAGE_SIZE = 20;

export type ProspectWithProperty = Prospect & {
  properties: { id: string; name: string } | null;
};

export type ProspectListParams = {
  q?: string;
  status?: ProspectStatus | "all";
  propertyId?: string;
  sort?: "company_name" | "created_at" | "status";
  order?: "asc" | "desc";
  page?: number;
};

export async function listProspects(params: ProspectListParams = {}) {
  await requireProfile();
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const sort = params.sort ?? "company_name";
  const order = params.order ?? "asc";
  const ascending = order === "asc";

  let query = supabase
    .from("prospects")
    .select("*, properties(id, name)", { count: "exact" })
    .order(sort, { ascending });

  if (params.propertyId) {
    query = query.eq("property_id", params.propertyId);
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }

  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    query = query.or(`company_name.ilike.${term},category.ilike.${term}`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    prospects: (data ?? []) as ProspectWithProperty[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export async function getProspect(id: string): Promise<ProspectWithProperty | null> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prospects")
    .select("*, properties(id, name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ProspectWithProperty | null;
}

export async function createProspect(
  propertyId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = parseProspectForm(formData);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid prospect");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .insert({
      ...prospectInputToRow(parsed.data),
      property_id: propertyId,
    })
    .select("id")
    .single();

  if (error || !data) {
    return actionError(error?.message ?? "Failed to create prospect");
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "prospect",
    entityId: data.id,
    propertyId,
    action: "created",
    metadata: { company_name: parsed.data.company_name },
  });

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/prospects");
  revalidatePath("/");
  redirect(`/prospects/${data.id}`);
}

export async function updateProspect(
  prospectId: string,
  propertyId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();
  const parsed = parseProspectForm(formData);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid prospect");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("prospects")
    .update(prospectInputToRow(parsed.data))
    .eq("id", prospectId);

  if (error) {
    return actionError(error.message);
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "prospect",
    entityId: prospectId,
    propertyId,
    action: "updated",
    metadata: { company_name: parsed.data.company_name },
  });

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/prospects");
  redirect(`/prospects/${prospectId}`);
}

export async function getProspectCount() {
  await requireProfile();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("prospects")
    .select("*", { count: "exact", head: true });

  if (error) {
    return 0;
  }
  return count ?? 0;
}
