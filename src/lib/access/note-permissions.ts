import type { AccessContext } from "@/lib/access/effective-role";
import { hasAccessRole } from "@/lib/permissions/roles";
import type { AccessRole } from "@/types/domain";

export function canCreateNotes(access: AccessContext): boolean {
  if (!access.canView || !access.effectiveRole) {
    return false;
  }

  return hasAccessRole(access.effectiveRole, "commenter");
}

export function canManageNote(
  access: AccessContext,
  noteUserId: string,
  currentUserId: string,
): boolean {
  if (!access.canView || !access.effectiveRole) {
    return false;
  }

  if (hasAccessRole(access.effectiveRole, "admin")) {
    return true;
  }

  return noteUserId === currentUserId && hasAccessRole(access.effectiveRole, "commenter");
}

export function isSheetAdmin(access: AccessContext): boolean {
  return Boolean(access.effectiveRole && hasAccessRole(access.effectiveRole, "admin"));
}

export function roleLabel(role: AccessRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
