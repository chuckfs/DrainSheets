"use server";

import { requireProfile } from "@/lib/auth/guards";
import type { ActivityWithProfile } from "@/lib/activity/format";
import { createClient } from "@/lib/supabase/server";

const ACTIVITY_FEED_LIMIT = 25;

export async function getRecentActivity(limit = ACTIVITY_FEED_LIMIT): Promise<ActivityWithProfile[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity")
    .select("*, profiles:user_id(id, name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const profiles = row.profiles;
    return {
      ...row,
      profiles: Array.isArray(profiles)
        ? profiles[0] ?? null
        : (profiles as ActivityWithProfile["profiles"]),
    };
  });
}
