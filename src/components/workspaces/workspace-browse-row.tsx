"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRightIcon, Trash2Icon } from "lucide-react";
import { deleteWorkspace } from "@/actions/workspaces";
import type { AccessContext } from "@/lib/access/effective-role";
import type { Workspace } from "@/types/domain";
import { DeleteResourceDialog } from "@/components/workspaces/delete-resource-dialog";
import { TreeItemOverflowMenu } from "@/components/workspaces/tree-item-overflow-menu";
import { WorkspaceAvatar } from "@/components/workspaces/workspace-avatar";
import { toast } from "sonner";

export function WorkspaceBrowseRow({
  workspace,
  access,
}: {
  workspace: Workspace;
  access: AccessContext;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDelete(): Promise<boolean> {
    const result = await deleteWorkspace(workspace.id);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    toast.success("Workspace deleted");
    router.push("/browse");
    router.refresh();
    return true;
  }

  return (
    <>
      <div className="group flex items-center gap-3 px-3 py-3 transition-colors hover:bg-accent">
        <Link href={`/workspaces/${workspace.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <WorkspaceAvatar id={workspace.id} name={workspace.name} className="size-9" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{workspace.name}</p>
            <p className="text-xs text-muted-foreground">Folders and sheets</p>
          </div>
        </Link>
        {access.canShare ? (
          <TreeItemOverflowMenu
            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            items={[
              {
                id: "delete",
                label: "Delete workspace",
                icon: <Trash2Icon className="size-3.5" />,
                destructive: true,
                onSelect: () => setDeleteOpen(true),
              },
            ]}
          />
        ) : (
          <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </div>

      <DeleteResourceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete workspace"
        description={`Delete “${workspace.name}”? All folders, sheets, and data in this workspace will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete workspace"
        onConfirm={handleDelete}
      />
    </>
  );
}
