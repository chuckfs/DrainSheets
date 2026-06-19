import type { AccessRole, OrgRole } from "@/types/domain";

const ORG_ROLE_LEVEL: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  editor: 1,
};

const ACCESS_ROLE_LEVEL: Record<AccessRole, number> = {
  viewer: 1,
  commenter: 2,
  editor: 3,
  admin: 4,
  owner: 5,
};

export function hasOrgRole(userRole: OrgRole, minRole: OrgRole): boolean {
  return ORG_ROLE_LEVEL[userRole] >= ORG_ROLE_LEVEL[minRole];
}

export function hasAccessRole(role: AccessRole, minRole: AccessRole): boolean {
  return ACCESS_ROLE_LEVEL[role] >= ACCESS_ROLE_LEVEL[minRole];
}

export function isOwner(role: OrgRole): boolean {
  return role === "owner";
}

export function isAdminOrAbove(role: OrgRole): boolean {
  return hasOrgRole(role, "admin");
}
