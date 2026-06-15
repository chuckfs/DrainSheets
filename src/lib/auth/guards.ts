import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { isOwner } from "@/lib/permissions/roles";
import type { Profile } from "@/types/domain";

export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.status === "disabled") {
    redirect("/login?error=account_disabled");
  }

  return profile;
}

export async function requireOwner(): Promise<Profile> {
  const profile = await requireProfile();

  if (!isOwner(profile.role)) {
    redirect("/settings");
  }

  return profile;
}
