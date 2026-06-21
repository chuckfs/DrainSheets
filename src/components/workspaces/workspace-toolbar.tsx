"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlusIcon, MoreHorizontalIcon, PlusIcon, Share2Icon, Trash2Icon, UploadIcon } from "lucide-react";
import { deleteWorkspace } from "@/actions/workspaces";
import type { AccessContext } from "@/lib/access/effective-role";
import type { Folder, Workspace } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { SheetHeader } from "@/components/layout/sheet-header";
import { AccessBadge } from "@/components/shares/access-badge";
import { ShareDialog } from "@/components/shares/share-dialog";
import { CreateFolderDialog } from "@/components/workspaces/create-folder-dialog";
import { CreateSheetDialog } from "@/components/sheets/create-sheet-dialog";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";
import { ImportDialog } from "@/components/import/import-dialog";
import { WorkspaceAvatar } from "@/components/workspaces/workspace-avatar";
import { DeleteResourceDialog } from "@/components/workspaces/delete-resource-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { WorkspaceSwitcher } from "./workspace-switcher";

export function WorkspaceToolbar({
  workspace,
  access,
  folders,
  canCreateWorkspace,
  workspaceSwitcher,
}: {
  workspace: Workspace;
  access: AccessContext;
  folders: Folder[];
  canCreateWorkspace: boolean;
  workspaceSwitcher?: React.ReactNode;
}) {
  const router = useRouter();
  const [workspaceShareOpen, setWorkspaceShareOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleDeleteWorkspace(): Promise<boolean> {
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
      <SheetHeader
        className="border-t-4 border-t-primary"
        eyebrow="Workspace"
        title={
          <span className="flex items-center gap-2">
            <WorkspaceAvatar id={workspace.id} name={workspace.name} className="size-8 text-[11px]" />
            {workspace.name}
          </span>
        }
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {workspaceSwitcher}
            <AccessBadge access={access} />
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-1.5">
            {canCreateWorkspace && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => setCreateWorkspaceOpen(true)}
              >
                <PlusIcon className="size-3.5" />
                New workspace
              </Button>
            )}
            {access.canEdit && (
              <>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setCreateSheetOpen(true)}
                >
                  <PlusIcon className="size-3.5" />
                  New sheet
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setCreateFolderOpen(true)}
                >
                  <FolderPlusIcon className="size-3.5" />
                  New folder
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() => setImportOpen(true)}
                >
                  <UploadIcon className="size-3.5" />
                  Import
                </Button>
              </>
            )}
            {access.canShare && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => setWorkspaceShareOpen(true)}
              >
                <Share2Icon className="size-3.5" />
                Share
              </Button>
            )}
            {access.canShare && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2"
                      aria-label="Workspace options"
                    >
                      <MoreHorizontalIcon className="size-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuGroup>
                    <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                      <Trash2Icon className="size-3.5" />
                      Delete workspace
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        }
      />

      <ShareDialog
        open={workspaceShareOpen}
        onOpenChange={setWorkspaceShareOpen}
        resourceType="workspace"
        resourceId={workspace.id}
        resourceName={workspace.name}
      />

      <CreateSheetDialog
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        workspaceId={workspace.id}
        onCreated={() => router.refresh()}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        workspaceId={workspace.id}
        folders={folders}
        onCreated={() => router.refresh()}
      />

      <CreateWorkspaceDialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        workspaceId={workspace.id}
        onImported={() => router.refresh()}
      />

      <DeleteResourceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete workspace"
        description={`Delete “${workspace.name}”? All folders, sheets, and data in this workspace will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete workspace"
        onConfirm={handleDeleteWorkspace}
      />
    </>
  );
}

export { WorkspaceSwitcher };
