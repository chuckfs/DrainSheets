import Link from "next/link";
import { ChevronRightIcon } from "lucide-react";
import { listWorkspaces } from "@/actions/workspaces";
import { requireProfile } from "@/lib/auth/guards";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { SheetHeader } from "@/components/layout/sheet-header";
import { WorkspaceAvatar } from "@/components/workspaces/workspace-avatar";

export default async function BrowsePage() {
  await requireProfile();
  const workspaces = await listWorkspaces();

  return (
    <ListPageShell
      header={
        <SheetHeader
          title="Browse"
          subtitle="Workspaces, folders, and sheets across your organization."
        />
      }
    >
      {workspaces.length === 0 ? (
        <p className="px-3 py-6 text-sm text-muted-foreground">No workspaces available.</p>
      ) : (
        <div className="divide-y">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspaces/${workspace.id}`}
              className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-accent"
            >
              <WorkspaceAvatar id={workspace.id} name={workspace.name} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{workspace.name}</p>
                <p className="text-xs text-muted-foreground">Folders and sheets</p>
              </div>
              <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </Link>
          ))}
        </div>
      )}
    </ListPageShell>
  );
}
