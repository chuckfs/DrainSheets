"use server";

import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Sheet } from "@/types/domain";

export async function listSheets(workspaceId: string): Promise<Sheet[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sheets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .order("position", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getSheet(sheetId: string): Promise<Sheet | null> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase.from("sheets").select("*").eq("id", sheetId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
