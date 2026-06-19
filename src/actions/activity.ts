"use server";

import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { Activity, Profile } from "@/types/domain";

export type ActivityWithActor = Activity & {
  actor: Pick<Profile, "id" | "name" | "email"> | null;
};

export async function listActivity(
  sheetId: string,
  rowId?: string | null,
  limit = 50,
): Promise<ActivityWithActor[]> {
  await requireProfile();
  const supabase = await createClient();

  let query = supabase
    .from("activity")
    .select(
      `
      *,
      actor:profiles!activity_actor_id_fkey (
        id,
        name,
        email
      )
    `,
    )
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (rowId) {
    query = query.eq("row_id", rowId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((entry) => ({
    ...entry,
    actor: (entry.actor as ActivityWithActor["actor"]) ?? null,
  }));
}
