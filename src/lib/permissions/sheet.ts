import type { AccessRole, OrgRole, Profile } from "@/types/domain";
import { hasAccessRole, hasOrgRole, isOwner } from "@/lib/permissions/roles";

export function canCreateWorkspace(profile: Profile): boolean {
  return hasOrgRole(profile.role, "admin");
}

export function canManageWorkspace(profile: Profile, accessRole?: AccessRole): boolean {
  if (hasOrgRole(profile.role, "admin")) {
    return true;
  }

  return accessRole ? hasAccessRole(accessRole, "admin") : false;
}

export function canEditSheetContent(profile: Profile, accessRole?: AccessRole): boolean {
  if (hasOrgRole(profile.role, "admin")) {
    return true;
  }

  if (accessRole) {
    return hasAccessRole(accessRole, "editor");
  }

  return isOwner(profile.role);
}

export function canCommentOnSheet(profile: Profile, accessRole?: AccessRole): boolean {
  if (canEditSheetContent(profile, accessRole)) {
    return true;
  }

  return accessRole ? hasAccessRole(accessRole, "commenter") : false;
}

export function canViewSheet(profile: Profile): boolean {
  return profile.status === "active";
}

export function orgRoleLabel(role: OrgRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function accessRoleLabel(role: AccessRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

const ACCESS_ROLE_DESCRIPTIONS: Record<AccessRole, string> = {
  viewer: "Can view the sheet and its rows, but can't change anything.",
  commenter: "Can view and add notes, but can't edit the data.",
  editor: "Can view, comment, and edit rows and columns.",
  admin: "Can edit, plus manage columns, sharing, and the sheet itself.",
  owner: "Full control, including deleting the sheet.",
};

export function accessRoleDescription(role: AccessRole): string {
  return ACCESS_ROLE_DESCRIPTIONS[role];
}
