"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export type FavoriteSheetItem = {
  sheet_id: string;
  sheet_name: string;
  workspace_id: string;
  workspace_name: string | null;
  favorited_at: string;
};

export async function listFavoriteSheets(limit = 20): Promise<FavoriteSheetItem[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: favorites, error } = await supabase
    .from("favorites")
    .select("target_id, created_at")
    .eq("user_id", profile.id)
    .eq("target_type", "sheet")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const sheetIds = (favorites ?? []).map((entry) => entry.target_id);
  if (sheetIds.length === 0) {
    return [];
  }

  const { data: sheets, error: sheetsError } = await supabase
    .from("sheets")
    .select(
      `
      id,
      name,
      workspace_id,
      workspaces (
        name
      )
    `,
    )
    .in("id", sheetIds);

  if (sheetsError) {
    throw new Error(sheetsError.message);
  }

  const sheetById = new Map((sheets ?? []).map((sheet) => [sheet.id, sheet]));
  const items: FavoriteSheetItem[] = [];

  for (const favorite of favorites ?? []) {
    const sheet = sheetById.get(favorite.target_id);
    if (!sheet) {
      continue;
    }

    items.push({
      sheet_id: sheet.id,
      sheet_name: sheet.name,
      workspace_id: sheet.workspace_id,
      workspace_name:
        sheet.workspaces && typeof sheet.workspaces === "object" && "name" in sheet.workspaces
          ? (sheet.workspaces.name as string)
          : null,
      favorited_at: favorite.created_at,
    });
  }

  return items;
}

export async function listFavoriteSheetIds(): Promise<string[]> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("favorites")
    .select("target_id")
    .eq("user_id", profile.id)
    .eq("target_type", "sheet");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((entry) => entry.target_id);
}

export async function toggleSheetFavorite(
  sheetId: string,
): Promise<ActionResult<{ favorited: boolean }>> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", profile.id)
    .eq("target_type", "sheet")
    .eq("target_id", sheetId)
    .maybeSingle();

  if (existingError) {
    return actionError(existingError.message);
  }

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) {
      return actionError(error.message);
    }

    revalidatePath("/");
    return actionSuccess({ favorited: false });
  }

  const { error } = await supabase.from("favorites").insert({
    user_id: profile.id,
    org_id: profile.org_id,
    target_type: "sheet",
    target_id: sheetId,
  });

  if (error) {
    return actionError(error.message);
  }

  revalidatePath("/");
  return actionSuccess({ favorited: true });
}
