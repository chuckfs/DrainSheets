import type { ComponentType } from "react";
import Link from "next/link";
import { ActivityIcon, ClockIcon, FileSpreadsheetIcon, StarIcon } from "lucide-react";
import type { ActivityWithActor } from "@/actions/activity";
import type { FavoriteSheetItem } from "@/actions/favorites";
import type { RecentSheetItem } from "@/lib/search/format";
import { formatActivityMessage, formatRelativeTime } from "@/lib/activity/format";
import { ActivityItem } from "@/components/activity/activity-item";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { SheetHeader } from "@/components/layout/sheet-header";
import { EmptyState } from "@/components/ui/empty-state";
import { WorkspaceAvatar } from "@/components/workspaces/workspace-avatar";
import { CreateWorkspaceGate } from "@/components/workspaces/create-workspace-gate";

function HomeSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
        {title}
      </div>
      {children}
    </section>
  );
}

function SheetLinkRow({
  href,
  sheetName,
  workspaceName,
}: {
  href: string;
  sheetName: string;
  workspaceName: string | null;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
    >
      <FileSpreadsheetIcon className="size-4 shrink-0 text-sheet-icon" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{sheetName}</p>
        {workspaceName ? (
          <p className="truncate text-xs text-muted-foreground">{workspaceName}</p>
        ) : null}
      </div>
    </Link>
  );
}

export function HomeDashboard({
  workspaces,
  recents,
  favorites,
  activity,
  showCreateWorkspace,
}: {
  workspaces: Array<{ id: string; name: string }>;
  recents: RecentSheetItem[];
  favorites: FavoriteSheetItem[];
  activity: ActivityWithActor[];
  showCreateWorkspace: boolean;
}) {
  return (
    <ListPageShell
      header={
        <SheetHeader
          eyebrow="Home"
          title="DrainSheets"
          subtitle="Recents, favorites, and activity across your workspaces."
        />
      }
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-8">
          <HomeSection title="Recents" icon={ClockIcon}>
            {recents.length === 0 ? (
              <EmptyState
                title="No recent sheets"
                description="Sheets you open will appear here for quick access."
              />
            ) : (
              <div className="space-y-2">
                {recents.map((item) => (
                  <SheetLinkRow
                    key={item.sheet_id}
                    href={`/sheets/${item.sheet_id}`}
                    sheetName={item.sheet_name}
                    workspaceName={item.workspace_name}
                  />
                ))}
              </div>
            )}
          </HomeSection>

          <HomeSection title="Favorites" icon={StarIcon}>
            {favorites.length === 0 ? (
              <EmptyState
                title="No favorites yet"
                description="Star a sheet in a workspace to pin it here."
              />
            ) : (
              <div className="space-y-2">
                {favorites.map((item) => (
                  <SheetLinkRow
                    key={item.sheet_id}
                    href={`/sheets/${item.sheet_id}`}
                    sheetName={item.sheet_name}
                    workspaceName={item.workspace_name}
                  />
                ))}
              </div>
            )}
          </HomeSection>
        </div>

        <div className="space-y-8">
          <HomeSection title="Workspaces" icon={FileSpreadsheetIcon}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {workspaces.map((workspace) => (
                <Link
                  key={workspace.id}
                  href={`/workspaces/${workspace.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-accent"
                >
                  <WorkspaceAvatar id={workspace.id} name={workspace.name} className="size-9" />
                  <span className="min-w-0 truncate text-sm font-medium">{workspace.name}</span>
                </Link>
              ))}
            </div>
          </HomeSection>

          <HomeSection title="Activity" icon={ActivityIcon}>
            {activity.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Edits and collaboration across your org will show up here."
              />
            ) : (
              <div className="space-y-2">
                {activity.map((item) => (
                  <ActivityItem
                    key={item.id}
                    message={formatActivityMessage(item, item.actor)}
                    timestamp={formatRelativeTime(item.created_at)}
                  />
                ))}
              </div>
            )}
          </HomeSection>
        </div>
      </div>

      {showCreateWorkspace && workspaces.length === 0 ? (
        <div className="mt-8">
          <CreateWorkspaceGate />
        </div>
      ) : null}
    </ListPageShell>
  );
}
