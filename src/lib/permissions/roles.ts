import type { UserRole } from "@/types/domain";

const ROLE_LEVEL: Record<UserRole, number> = {
  owner: 3,
  admin: 2,
  editor: 1,
};

export function hasRole(userRole: UserRole, minRole: UserRole): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[minRole];
}

export function isOwner(role: UserRole): boolean {
  return role === "owner";
}

export function isAdminOrAbove(role: UserRole): boolean {
  return hasRole(role, "admin");
}
