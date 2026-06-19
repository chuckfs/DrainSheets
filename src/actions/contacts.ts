"use server";

import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Contact } from "@/types/domain";

export type ContactPickerItem = Pick<
  Contact,
  "id" | "first_name" | "last_name" | "email" | "phone"
>;

export async function searchContacts(query: string, limit = 20): Promise<ContactPickerItem[]> {
  await requireProfile();
  const supabase = await createClient();

  let builder = supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone")
    .order("first_name", { ascending: true })
    .limit(limit);

  const trimmed = query.trim();
  if (trimmed) {
    const term = `%${trimmed}%`;
    builder = builder.or(
      `first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},company.ilike.${term}`,
    );
  }

  const { data, error } = await builder;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getContactsByIds(ids: string[]): Promise<ContactPickerItem[]> {
  await requireProfile();

  if (ids.length === 0) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, first_name, last_name, email, phone")
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}
