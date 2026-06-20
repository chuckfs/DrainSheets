"use client";

import { WorkspaceErrorBoundary } from "@/components/errors/error-boundaries";
import { WorkspaceTree } from "@/components/browse/workspace-tree";
import type { AccessContext } from "@/lib/access/effective-role";
import type { Folder, Sheet } from "@/types/domain";

export function WorkspaceTreePanel({
  workspaceId,
  folders,
  sheets,
  access,
  activeSheetId,
  favoriteSheetIds,
}: {
  workspaceId: string;
  folders: Folder[];
  sheets: Sheet[];
  access: AccessContext;
  activeSheetId?: string;
  favoriteSheetIds?: Set<string>;
}) {
  return (
    <WorkspaceErrorBoundary>
      <WorkspaceTree
        workspaceId={workspaceId}
        folders={folders}
        sheets={sheets}
        access={access}
        activeSheetId={activeSheetId}
        favoriteSheetIds={favoriteSheetIds}
      />
    </WorkspaceErrorBoundary>
  );
}
