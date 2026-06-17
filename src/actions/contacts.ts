"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity";
import { actionError, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { canDeleteContact, canEditContact } from "@/lib/permissions/contact";
import { createClient } from "@/lib/supabase/server";
import { contactInputToRow, parseContactForm } from "@/lib/validations/crm";
import type { Contact } from "@/types/domain";

const PAGE_SIZE = 20;

type ProspectRef = {
  id: string;
  company_name: string;
  property_id: string;
  properties: { id: string; name: string } | null;
};

export type ContactWithProspect = Contact & {
  prospects: ProspectRef | null;
};

export type ContactListParams = {
  q?: string;
  prospectId?: string;
  sort?: "first_name" | "company" | "created_at";
  order?: "asc" | "desc";
  page?: number;
};

async function getProspectPropertyId(prospectId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select("property_id")
    .eq("id", prospectId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.property_id;
}

export async function listContacts(params: ContactListParams = {}) {
  await requireProfile();
  const supabase = await createClient();

  const page = Math.max(1, params.page ?? 1);
  const sort = params.sort ?? "first_name";
  const order = params.order ?? "asc";
  const ascending = order === "asc";

  let query = supabase
    .from("contacts")
    .select("*, prospects(id, company_name, property_id, properties(id, name))", {
      count: "exact",
    })
    .order(sort, { ascending });

  if (params.prospectId) {
    query = query.eq("prospect_id", params.prospectId);
  }

  if (params.q?.trim()) {
    const term = `%${params.q.trim()}%`;
    query = query.or(
      `first_name.ilike.${term},last_name.ilike.${term},company.ilike.${term},email.ilike.${term},phone.ilike.${term}`,
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return {
    contacts: (data ?? []) as ContactWithProspect[],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil((count ?? 0) / PAGE_SIZE),
  };
}

export type PropertyProspectContact = {
  prospect_id: string;
  label: string;
  email: string | null;
  phone: string | null;
};

export async function listContactsForProperty(
  propertyId: string,
): Promise<PropertyProspectContact[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data: prospects, error: prospectError } = await supabase
    .from("prospects")
    .select("id")
    .eq("property_id", propertyId);

  if (prospectError) {
    throw new Error(prospectError.message);
  }

  const prospectIds = (prospects ?? []).map((row) => row.id);
  if (prospectIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("contacts")
    .select("prospect_id, first_name, last_name, email, phone")
    .in("prospect_id", prospectIds)
    .order("first_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const labels = new Map<
    string,
    { label: string; email: string | null; phone: string | null }
  >();
  for (const contact of data ?? []) {
    if (!contact.prospect_id || labels.has(contact.prospect_id)) {
      continue;
    }
    const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ");
    labels.set(contact.prospect_id, {
      label: name || "Contact",
      email: contact.email,
      phone: contact.phone,
    });
  }

  return Array.from(labels.entries()).map(([prospect_id, value]) => ({
    prospect_id,
    label: value.label,
    email: value.email,
    phone: value.phone,
  }));
}

export async function getContact(id: string): Promise<ContactWithProspect | null> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select("*, prospects(id, company_name, property_id, properties(id, name))")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as ContactWithProspect | null;
}

/** Alias for milestone spec compatibility */
export const getContactById = getContact;

export async function createContact(
  prospectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();

  if (!canEditContact(profile)) {
    return actionError("You do not have permission to create contacts");
  }

  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid contact");
  }

  const propertyId = await getProspectPropertyId(prospectId);
  if (!propertyId) {
    return actionError("Prospect not found");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .insert({
      ...contactInputToRow(parsed.data),
      prospect_id: prospectId,
      org_id: profile.org_id,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return actionError(error?.message ?? "Failed to create contact");
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "contact",
    entityId: data.id,
    propertyId,
    action: "created",
    metadata: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      prospect_id: prospectId,
    },
  });

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/contacts");
  revalidatePath("/");
  redirect(`/prospects/${prospectId}`);
}

export async function updateContact(
  contactId: string,
  prospectId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireProfile();

  if (!canEditContact(profile)) {
    return actionError("You do not have permission to edit contacts");
  }

  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid contact");
  }

  const propertyId = await getProspectPropertyId(prospectId);
  if (!propertyId) {
    return actionError("Prospect not found");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({
      ...contactInputToRow(parsed.data),
      updated_by: profile.id,
    })
    .eq("id", contactId);

  if (error) {
    return actionError(error.message);
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "contact",
    entityId: contactId,
    propertyId,
    action: "updated",
    metadata: {
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      prospect_id: prospectId,
    },
  });

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath(`/contacts/${contactId}`);
  revalidatePath("/contacts");
  redirect(`/contacts/${contactId}`);
}

export async function deleteContact(contactId: string, prospectId: string): Promise<ActionResult> {
  const profile = await requireProfile();

  if (!canDeleteContact(profile)) {
    return actionError("You do not have permission to delete contacts");
  }

  const propertyId = await getProspectPropertyId(prospectId);
  if (!propertyId) {
    return actionError("Prospect not found");
  }

  const supabase = await createClient();
  const { data: contact } = await supabase
    .from("contacts")
    .select("first_name, last_name")
    .eq("id", contactId)
    .maybeSingle();

  const { error } = await supabase.from("contacts").delete().eq("id", contactId);

  if (error) {
    return actionError(error.message);
  }

  await logActivity({
    orgId: profile.org_id,
    userId: profile.id,
    entityType: "contact",
    entityId: contactId,
    propertyId,
    action: "deleted",
    metadata: {
      first_name: contact?.first_name,
      last_name: contact?.last_name,
      prospect_id: prospectId,
    },
  });

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/contacts");
  revalidatePath("/");
  return { success: true };
}

export async function getContactCount() {
  await requireProfile();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("contacts")
    .select("*", { count: "exact", head: true });

  if (error) {
    return 0;
  }
  return count ?? 0;
}
