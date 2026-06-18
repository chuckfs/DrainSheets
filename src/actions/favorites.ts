"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/types/domain";

export type FavoriteProperty = {
  propertyId: string;
  createdAt: string;
  property: Pick<Property, "id" | "name" | "address" | "city" | "state" | "status" | "updated_at">;
};

async function assertPropertyAccess(propertyId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("properties")
    .select("id")
    .eq("id", propertyId)
    .maybeSingle();

  if (error) {
    return actionError(error.message);
  }

  if (!data) {
    return actionError("Property not found");
  }

  return actionSuccess();
}

export async function listFavorites(): Promise<FavoriteProperty[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("favorites")
    .select(
      "property_id, created_at, properties:property_id(id, name, address, city, state, status, updated_at)",
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

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
        createdAt: row.created_at,
        property,
      };
    })
    .filter((entry): entry is FavoriteProperty => entry !== null);
}

export async function listFavoritePropertyIds(): Promise<string[]> {
  const favorites = await listFavorites();
  return favorites.map((favorite) => favorite.propertyId);
}

export async function isFavorite(propertyId: string): Promise<boolean> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", profile.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

export async function toggleFavorite(
  propertyId: string,
): Promise<ActionResult<{ favorited: boolean }>> {
  const profile = await requireProfile();
  const access = await assertPropertyAccess(propertyId);

  if (!access.success) {
    return actionError("error" in access ? access.error : "Property not found");
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", profile.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (existingError) {
    return actionError(existingError.message);
  }

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id)
      .eq("user_id", profile.id);

    if (error) {
      return actionError(error.message);
    }

    revalidatePath("/");
    revalidatePath("/properties");
    return actionSuccess({ favorited: false });
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: profile.id,
    property_id: propertyId,
  });

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/");
  revalidatePath("/properties");
  return actionSuccess({ favorited: true });
}
