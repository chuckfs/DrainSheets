import { requireProfile } from "@/lib/auth/guards";
import { listWorkspaces } from "@/actions/workspaces";
import { canCreateWorkspace } from "@/lib/permissions/sheet";
import { SearchCommandProvider } from "@/components/layout/search-command-provider";
import { WorkspaceRailShell } from "@/components/layout/icon-rail";
import { SiteHeader } from "@/components/layout/site-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const workspaces = await listWorkspaces();
  const railWorkspaces = workspaces.map((w) => ({ id: w.id, name: w.name }));
  const showCreateWorkspace = canCreateWorkspace(profile);

  return (
    <SearchCommandProvider>
      <WorkspaceRailShell
        workspaces={railWorkspaces}
        canCreateWorkspace={showCreateWorkspace}
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <SiteHeader
            profile={profile}
            workspaces={railWorkspaces}
            canCreateWorkspace={showCreateWorkspace}
          />
          <main className="flex-1 overflow-auto p-3">{children}</main>
        </div>
      </WorkspaceRailShell>
    </SearchCommandProvider>
  );
}
