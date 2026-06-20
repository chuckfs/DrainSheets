import Link from "next/link";
import type { ActivityWithActor } from "@/actions/activity";
import type { FavoriteSheetItem } from "@/actions/favorites";
import type { RecentSheetItem } from "@/lib/search/format";
import type { HomeTab } from "@/lib/navigation";
import { formatActivityMessage, formatRelativeTime } from "@/lib/activity/format";
import { ActivityItem } from "@/components/activity/activity-item";
import { HomeFavoritesTable } from "@/components/home/home-favorites-table";
import { HomeRecentsTable } from "@/components/home/home-recents-table";
import { HomeTabBar } from "@/components/home/home-tab-bar";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { SheetHeader } from "@/components/layout/sheet-header";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkspaceAvatar } from "@/components/workspaces/workspace-avatar";
import { CreateWorkspaceGate } from "@/components/workspaces/create-workspace-gate";

export function HomeDashboard({
  tab,
  workspaces,
  recents,
  favorites,
  activity,
  showCreateWorkspace,
}: {
  tab: HomeTab;
  workspaces: Array<{ id: string; name: string }>;
  recents: RecentSheetItem[];
  favorites: FavoriteSheetItem[];
  activity: ActivityWithActor[];
  showCreateWorkspace: boolean;
}) {
  return (
    <ListPageShell
      header={
        <>
          <SheetHeader title="DrainSheets" />
          <HomeTabBar activeTab={tab} />
        </>
      }
    >
      {tab === "recents" ? <HomeRecentsTable items={recents} /> : null}

      {tab === "favorites" ? <HomeFavoritesTable items={favorites} /> : null}

      {tab === "activity" ? (
        activity.length === 0 ? (
          <EmptyState
            title="No activity yet"
            description="Edits and collaboration across your org will show up here."
          />
        ) : (
          <div className="space-y-2 p-3">
            {activity.map((item) => (
              <ActivityItem
                key={item.id}
                message={formatActivityMessage(item, item.actor)}
                timestamp={formatRelativeTime(item.created_at)}
              />
            ))}
          </div>
        )
      ) : null}

      {tab === "workspaces" ? (
        workspaces.length === 0 ? (
          showCreateWorkspace ? (
            <div className="p-3">
              <CreateWorkspaceGate />
            </div>
          ) : (
            <EmptyState
              title="No workspaces yet"
              description="You do not have access to any workspaces."
            />
          )
        ) : (
          <div className="divide-y">
            {workspaces.map((workspace) => (
              <Link
                key={workspace.id}
                href={`/workspaces/${workspace.id}`}
                className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-accent"
              >
                <WorkspaceAvatar id={workspace.id} name={workspace.name} className="size-9" />
                <span className="min-w-0 truncate text-sm font-medium">{workspace.name}</span>
              </Link>
            ))}
          </div>
        )
      ) : null}
    </ListPageShell>
  );
}
