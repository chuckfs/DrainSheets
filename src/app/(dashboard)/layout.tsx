import { requireProfile } from "@/lib/auth/guards";
import { listWorkspaces } from "@/actions/workspaces";
import { WorkspaceRailShell } from "@/components/layout/icon-rail";
import { SiteHeader } from "@/components/layout/site-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const workspaces = await listWorkspaces();

  return (
    <WorkspaceRailShell workspaces={workspaces.map((w) => ({ id: w.id, name: w.name }))}>
      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader
          profile={profile}
          workspaces={workspaces.map((w) => ({ id: w.id, name: w.name }))}
        />
        <main className="flex-1 overflow-auto p-3">{children}</main>
      </div>
    </WorkspaceRailShell>
  );
}
