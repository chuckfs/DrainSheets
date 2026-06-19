import { notFound } from "next/navigation";
import { getWorkspaceAccessContext } from "@/actions/access";
import { listFolders } from "@/actions/folders";
import { listSheets } from "@/actions/sheets";
import { getWorkspace, listWorkspaces } from "@/actions/workspaces";
import { requireProfile } from "@/lib/auth/guards";
import { canCreateWorkspace } from "@/lib/permissions/sheet";
import { WorkspaceTreePanel } from "@/components/workspaces/workspace-tree-panel";
import { ListPageShell } from "@/components/layout/list-page-shell";
import {
  WorkspaceSwitcher,
  WorkspaceToolbar,
} from "@/components/workspaces/workspace-toolbar";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const profile = await requireProfile();
  const [workspace, access, sheets, workspaces, folders] = await Promise.all([
    getWorkspace(workspaceId),
    getWorkspaceAccessContext(workspaceId),
    listSheets(workspaceId),
    listWorkspaces(),
    listFolders(workspaceId),
  ]);

  if (!workspace || !access.canView) {
    notFound();
  }

  return (
    <ListPageShell
      header={
        <WorkspaceToolbar
          workspace={workspace}
          access={access}
          folders={folders}
          canCreateWorkspace={canCreateWorkspace(profile)}
          workspaceSwitcher={
            <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={workspace.id} />
          }
        />
      }
    >
      <WorkspaceTreePanel
        workspaceId={workspaceId}
        folders={folders}
        sheets={sheets}
        access={access}
      />
    </ListPageShell>
  );
}
