"use server";

import { requireProfile } from "@/lib/auth/guards";
import { hasRole } from "@/lib/permissions/roles";
import { getContactCount } from "@/actions/contacts";
import { getDocumentCount } from "@/actions/documents";
import { getNoteCount } from "@/actions/notes";
import { getPropertyCount } from "@/actions/properties";
import { getProspectCount } from "@/actions/prospects";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/domain";

export type DashboardStats = {
  properties: number;
  prospects: number;
  contacts: number;
  documents: number;
  notes: number;
};

export type AssignedProperty = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
};

export type RecentProspect = {
  id: string;
  company_name: string;
  properties: { id: string; name: string } | null;
};

const CARD_LIMIT = 10;

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireProfile();

  const [properties, prospects, contacts, documents, notes] = await Promise.all([
    getPropertyCount("active"),
    getProspectCount(),
    getContactCount(),
    getDocumentCount(),
    getNoteCount(),
  ]);

  return { properties, prospects, contacts, documents, notes };
}

export async function getAssignedProperties(): Promise<AssignedProperty[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (hasRole(profile.role, "admin")) {
    const { data, error } = await supabase
      .from("properties")
      .select("id, name, city, state")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(CARD_LIMIT);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  }

  const { data, error } = await supabase
    .from("property_assignments")
    .select("properties(id, name, city, state)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(CARD_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => {
      const property = Array.isArray(row.properties) ? row.properties[0] : row.properties;
      return property;
    })
    .filter((property): property is AssignedProperty => property !== null);
}

export async function getRecentProspects(): Promise<RecentProspect[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("prospects")
    .select("id, company_name, properties(id, name)")
    .order("created_at", { ascending: false })
    .limit(CARD_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    company_name: row.company_name,
    properties: Array.isArray(row.properties) ? row.properties[0] ?? null : row.properties,
  }));
}

export async function getDashboardData(profile: Profile) {
  const [stats, assignedProperties, recentProspects] = await Promise.all([
    getDashboardStats(),
    getAssignedProperties(),
    getRecentProspects(),
  ]);

  return {
    stats,
    assignedProperties,
    recentProspects,
    assignedTitle: hasRole(profile.role, "admin")
      ? "Recent properties"
      : "My assigned properties",
  };
}
