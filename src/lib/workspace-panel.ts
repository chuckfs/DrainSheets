export const WORKSPACE_PANEL_STORAGE_KEY = "drainsheets:workspace-panel";
const CLOSED_VALUE = "closed";

export type WorkspacePanel = "attachments" | "activity" | "details";

export function parseStoredWorkspacePanel(value: string | null): WorkspacePanel | null {
  if (!value || value === CLOSED_VALUE) {
    return null;
  }

  if (value === "attachments" || value === "activity" || value === "details") {
    return value;
  }

  // Migrate legacy panel names
  if (value === "notes") {
    return "attachments";
  }

  return null;
}

export function readStoredWorkspacePanel(): WorkspacePanel | null {
  if (typeof window === "undefined") {
    return null;
  }

  return parseStoredWorkspacePanel(localStorage.getItem(WORKSPACE_PANEL_STORAGE_KEY));
}

export function storeWorkspacePanel(panel: WorkspacePanel | null): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(WORKSPACE_PANEL_STORAGE_KEY, panel ?? CLOSED_VALUE);
}
