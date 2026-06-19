import type { AccessRole } from "@/types/domain";
import { hasAccessRole } from "@/lib/permissions/roles";

export type AccessSource = "org_admin" | "workspace" | "folder" | "sheet" | "none";

export type AccessContext = {
  effectiveRole: AccessRole | null;
  source: AccessSource;
  sourceLabel: string;
  canView: boolean;
  canEdit: boolean;
  canShare: boolean;
};

const SOURCE_LABELS: Record<AccessSource, string> = {
  org_admin: "Organization Admin",
  workspace: "Inherited from Workspace",
  folder: "Inherited from Folder",
  sheet: "Direct Access",
  none: "No Access",
};

const SOURCE_PRIORITY: Record<AccessSource, number> = {
  sheet: 3,
  folder: 2,
  workspace: 1,
  org_admin: 4,
  none: 0,
};

type ShareCandidate = {
  role: AccessRole;
  source: AccessSource;
};

export function buildAccessContext(
  candidates: ShareCandidate[],
  isOrgAdmin: boolean,
): AccessContext {
  if (isOrgAdmin) {
    return {
      effectiveRole: "admin",
      source: "org_admin",
      sourceLabel: SOURCE_LABELS.org_admin,
      canView: true,
      canEdit: true,
      canShare: true,
    };
  }

  if (candidates.length === 0) {
    return {
      effectiveRole: null,
      source: "none",
      sourceLabel: SOURCE_LABELS.none,
      canView: false,
      canEdit: false,
      canShare: false,
    };
  }

  const winning = candidates.reduce((best, candidate) => {
    const roleLevel = accessLevel(candidate.role);
    const bestLevel = accessLevel(best.role);

    if (roleLevel > bestLevel) {
      return candidate;
    }

    if (roleLevel === bestLevel && SOURCE_PRIORITY[candidate.source] > SOURCE_PRIORITY[best.source]) {
      return candidate;
    }

    return best;
  });

  return {
    effectiveRole: winning.role,
    source: winning.source,
    sourceLabel: SOURCE_LABELS[winning.source],
    canView: hasAccessRole(winning.role, "viewer"),
    canEdit: hasAccessRole(winning.role, "editor"),
    canShare: hasAccessRole(winning.role, "admin"),
  };
}

function accessLevel(role: AccessRole): number {
  const levels: Record<AccessRole, number> = {
    viewer: 1,
    commenter: 2,
    editor: 3,
    admin: 4,
    owner: 5,
  };

  return levels[role];
}

export function grantableShareRoles(): AccessRole[] {
  return ["viewer", "commenter", "editor", "admin"];
}
