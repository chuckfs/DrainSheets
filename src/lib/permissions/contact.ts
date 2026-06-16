import type { Profile } from "@/types/domain";
import { hasRole } from "@/lib/permissions/roles";

export function canEditContact(profile: Profile): boolean {
  return hasRole(profile.role, "editor");
}

export function canDeleteContact(profile: Profile): boolean {
  return hasRole(profile.role, "editor");
}
