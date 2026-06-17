"use client";

import { useCallback, useEffect, useState } from "react";
import {
  readStoredWorkspacePanel,
  storeWorkspacePanel,
  type WorkspacePanel,
} from "@/lib/workspace-panel";

export function useWorkspacePanel() {
  const [activePanel, setActivePanelState] = useState<WorkspacePanel | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setActivePanelState(readStoredWorkspacePanel());
    setHydrated(true);
  }, []);

  const setActivePanel = useCallback((value: WorkspacePanel | null) => {
    setActivePanelState(value);
    storeWorkspacePanel(value);
  }, []);

  const togglePanel = useCallback((panel: WorkspacePanel) => {
    setActivePanelState((current) => {
      const next = current === panel ? null : panel;
      storeWorkspacePanel(next);
      return next;
    });
  }, []);

  const closePanel = useCallback(() => {
    setActivePanelState(null);
    storeWorkspacePanel(null);
  }, []);

  return {
    activePanel,
    setActivePanel,
    togglePanel,
    closePanel,
    hydrated,
  };
}
