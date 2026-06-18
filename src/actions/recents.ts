"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/types/domain";

const DEFAULT_RECENT_LIMIT = 10;

export type RecentPropertyView = {
  propertyId: string;
  viewedAt: string;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state" | "status" | "updated_at">;
};

export async function listRecentViews(limit = DEFAULT_RECENT_LIMIT): Promise<RecentPropertyView[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recent_views")
    .select(
      "property_id, viewed_at, properties:property_id(id, name, address, city, state, status, updated_at)",
    )
    .eq("user_id", profile.id)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((row) => {
      const property = Array.isArray(row.properties) ? row.properties[0] : row.properties;
      if (!property) {
        return null;
      }

      return {
        propertyId: row.property_id,
        viewedAt: row.viewed_at,
        property,
      };
    })
    .filter((entry): entry is RecentPropertyView => entry !== null);
}

export async function getRecentViewedAtMap(
  propertyIds: string[],
): Promise<Record<string, string>> {
  if (propertyIds.length === 0) {
    return {};
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recent_views")
    .select("property_id, viewed_at")
    .eq("user_id", profile.id)
    .in("property_id", propertyIds);

  if (error) {
    throw new Error(error.message);
  }

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.property_id] = row.viewed_at;
  }

  return map;
}

export async function trackRecentView(propertyId: string): Promise<ActionResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .maybeSingle();

  if (propertyError) {
    return actionError(propertyError.message);
  }

  if (!property) {
    return actionError("Property not found");
  }

  const viewedAt = new Date().toISOString();
  const { error } = await supabase.from("recent_views").upsert(
    {
      user_id: profile.id,
      property_id: propertyId,
      viewed_at: viewedAt,
    },
    { onConflict: "user_id,property_id" },
  );

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/");
  revalidatePath("/properties");
  return actionSuccess();
}
