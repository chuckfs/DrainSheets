import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspace, listWorkspaces } from "@/actions/workspaces";
import { listSheets } from "@/actions/sheets";
import { WorkspaceTree } from "@/components/browse/workspace-tree";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { SheetHeader } from "@/components/layout/sheet-header";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const [workspace, sheets, workspaces] = await Promise.all([
    getWorkspace(workspaceId),
    listSheets(workspaceId),
    listWorkspaces(),
  ]);

  if (!workspace) {
    notFound();
  }

  return (
    <ListPageShell
      header={
        <SheetHeader
          eyebrow="Workspace"
          title={workspace.name}
          subtitle={`${sheets.length} sheet${sheets.length === 1 ? "" : "s"}`}
          meta={
            workspaces.length > 1 ? (
              <div className="flex flex-wrap gap-1">
                {workspaces.map((item) => (
                  <Link
                    key={item.id}
                    href={`/workspaces/${item.id}`}
                    className={
                      item.id === workspace.id
                        ? "rounded-md bg-primary px-2 py-0.5 text-[11px] text-primary-foreground"
                        : "rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                    }
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            ) : undefined
          }
        />
      }
    >
      <WorkspaceTree sheets={sheets} />
    </ListPageShell>
  );
}
