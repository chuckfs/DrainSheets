import { getWorkspaceAccessContext } from "@/actions/access";
import { listWorkspaces } from "@/actions/workspaces";
import { requireProfile } from "@/lib/auth/guards";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { SheetHeader } from "@/components/layout/sheet-header";
import { WorkspaceBrowseRow } from "@/components/workspaces/workspace-browse-row";

export default async function BrowsePage() {
  await requireProfile();
  const workspaces = await listWorkspaces();
  const workspacesWithAccess = await Promise.all(
    workspaces.map(async (workspace) => ({
      workspace,
      access: await getWorkspaceAccessContext(workspace.id),
    })),
  );

  return (
    <ListPageShell
      header={
        <SheetHeader
          title="Browse"
          subtitle="Workspaces, folders, and sheets across your organization."
        />
      }
    >
      {workspacesWithAccess.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted-foreground">No workspaces available.</p>
      ) : (
        <div className="divide-y">
          {workspacesWithAccess.map(({ workspace, access }) => (
            <WorkspaceBrowseRow key={workspace.id} workspace={workspace} access={access} />
          ))}
        </div>
      )}
    </ListPageShell>
  );
}
