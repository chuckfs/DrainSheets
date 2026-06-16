import type { Profile, PropertyStatus } from "@/types/domain";
import { hasRole, isOwner } from "@/lib/permissions/roles";

export function canCreateProperty(profile: Profile): boolean {
  return hasRole(profile.role, "admin");
}

export function canArchiveProperty(profile: Profile): boolean {
  return hasRole(profile.role, "admin");
}

export function canEditProperty(profile: Profile): boolean {
  return hasRole(profile.role, "editor");
}

export function canManageAssignments(profile: Profile): boolean {
  return isOwner(profile.role);
}

export function canEditProspect(profile: Profile): boolean {
  return hasRole(profile.role, "editor");
}

export function propertyStatusLabel(status: PropertyStatus): string {
  return status === "archived" ? "Archived" : "Active";
}
