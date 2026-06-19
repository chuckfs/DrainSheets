import { redirect } from "next/navigation";
import { getDefaultWorkspace } from "@/actions/workspaces";
import { requireProfile } from "@/lib/auth/guards";
import { canCreateWorkspace } from "@/lib/permissions/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { SheetHeader } from "@/components/layout/sheet-header";
import { CreateWorkspaceGate } from "@/components/workspaces/create-workspace-gate";

export default async function HomePage() {
  const workspace = await getDefaultWorkspace();

  if (workspace) {
    redirect(`/workspaces/${workspace.id}`);
  }

  const profile = await requireProfile();
  const showCreate = canCreateWorkspace(profile);

  return (
    <ListPageShell
      header={
        <SheetHeader
          title="Welcome"
          subtitle={
            showCreate
              ? "Create your first workspace to get started."
              : "No workspace found. Ask an org admin to create one or share access with you."
          }
        />
      }
    >
      {showCreate ? (
        <CreateWorkspaceGate />
      ) : (
        <EmptyState
          title="No workspaces yet"
          description="You do not have access to any workspaces. Ask an org admin to create one or share access with you."
        />
      )}
    </ListPageShell>
  );
}
