import { listOrgActivity } from "@/actions/activity";
import { listFavoriteSheets } from "@/actions/favorites";
import { getRecentSheets } from "@/actions/search";
import { listWorkspaces } from "@/actions/workspaces";
import { requireProfile } from "@/lib/auth/guards";
import { canCreateWorkspace } from "@/lib/permissions/sheet";
import { HomeDashboard } from "@/components/home/home-dashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { SheetHeader } from "@/components/layout/sheet-header";
import { CreateWorkspaceGate } from "@/components/workspaces/create-workspace-gate";
import { parseHomeTab } from "@/lib/navigation";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab = parseHomeTab(tabParam);
  const profile = await requireProfile();
  const [workspaces, recents, favorites, activity] = await Promise.all([
    listWorkspaces(),
    getRecentSheets(),
    listFavoriteSheets(),
    listOrgActivity(12),
  ]);

  const showCreateWorkspace = canCreateWorkspace(profile);

  if (workspaces.length === 0) {
    return (
      <ListPageShell
        header={
          <SheetHeader
            title="Welcome"
            subtitle={
              showCreateWorkspace
                ? "Create your first workspace to get started."
                : "No workspace found. Ask an org admin to create one or share access with you."
            }
          />
        }
      >
        {showCreateWorkspace ? (
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

  return (
    <HomeDashboard
      tab={tab}
      workspaces={workspaces.map((workspace) => ({ id: workspace.id, name: workspace.name }))}
      recents={recents}
      favorites={favorites}
      activity={activity}
      showCreateWorkspace={showCreateWorkspace}
    />
  );
}
