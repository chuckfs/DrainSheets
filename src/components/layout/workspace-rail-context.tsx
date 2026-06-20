"use client";

import { createContext, useContext, useEffect } from "react";

type WorkspaceRailContextValue = {
  activeWorkspaceId: string | null;
  setSheetWorkspaceId: (workspaceId: string | null) => void;
};

export const WorkspaceRailContext = createContext<WorkspaceRailContextValue | null>(null);

export function useWorkspaceRail() {
  return useContext(WorkspaceRailContext);
}

export function SetActiveWorkspace({ workspaceId }: { workspaceId: string }) {
  const context = useWorkspaceRail();

  useEffect(() => {
    context?.setSheetWorkspaceId(workspaceId);
    return () => context?.setSheetWorkspaceId(null);
  }, [context, workspaceId]);

  return null;
}
