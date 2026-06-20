/**
 * Deterministic workspace identity: a color slot + initials derived from the
 * workspace's stable id and name. No stored color/icon needed — the avatar is
 * computed at render time and stays consistent for a given workspace.
 */

/** Number of curated palette slots defined in globals.css (--ws-0..--ws-7). */
export const WORKSPACE_PALETTE_SIZE = 8;

/** Stable djb2 hash → non-negative integer. */
function hashString(value: string): number {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return hash >>> 0;
}

/** Map a workspace id to one of the curated palette slots (0..N-1). */
export function workspacePaletteIndex(id: string): number {
  return hashString(id) % WORKSPACE_PALETTE_SIZE;
}

/** Preview palette before a workspace id exists (create dialog). */
export function previewWorkspacePaletteIndex(name: string): number {
  return hashString(name.trim() || "New workspace") % WORKSPACE_PALETTE_SIZE;
}

/** 1–2 uppercase initials from a workspace name. */
export function workspaceInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export type WorkspaceAvatarTokens = {
  index: number;
  initials: string;
  /** CSS var references that adapt to light/dark automatically. */
  bg: string;
  fg: string;
  accent: string;
};

export function workspaceAvatarTokens(
  id: string,
  name: string,
  options?: { preview?: boolean },
): WorkspaceAvatarTokens {
  const index = options?.preview ? previewWorkspacePaletteIndex(name) : workspacePaletteIndex(id);
  return {
    index,
    initials: workspaceInitials(name),
    bg: `var(--ws-${index}-bg)`,
    fg: `var(--ws-${index}-fg)`,
    accent: `var(--ws-${index}-accent)`,
  };
}
