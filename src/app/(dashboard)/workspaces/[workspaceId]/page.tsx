import { notFound } from "next/navigation";
import { getWorkspaceAccessContext } from "@/actions/access";
import { listFolders } from "@/actions/folders";
import { listSheets } from "@/actions/sheets";
import { getWorkspace, listWorkspaces } from "@/actions/workspaces";
import { WorkspaceTree } from "@/components/browse/workspace-tree";
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
          workspaceSwitcher={
            <WorkspaceSwitcher workspaces={workspaces} activeWorkspaceId={workspace.id} />
          }
        />
      }
    >
      <WorkspaceTree sheets={sheets} />
    </ListPageShell>
  );
}
