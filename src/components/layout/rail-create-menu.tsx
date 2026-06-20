"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FolderPlusIcon, FileSpreadsheetIcon, LayoutGridIcon, PlusIcon } from "lucide-react";
import { listFolders } from "@/actions/folders";
import { resolveRailWorkspaceId } from "@/lib/rail-workspace";
import type { Folder } from "@/types/domain";
import { useWorkspaceRail } from "@/components/layout/workspace-rail-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog";
import { CreateSheetDialog } from "@/components/sheets/create-sheet-dialog";
import { CreateFolderDialog } from "@/components/workspaces/create-folder-dialog";
import type { RailWorkspace } from "@/components/layout/icon-rail";

export function RailCreateMenu({
  workspaces,
  canCreateWorkspace,
}: {
  workspaces: RailWorkspace[];
  canCreateWorkspace: boolean;
}) {
  const pathname = usePathname();
  const rail = useWorkspaceRail();
  const workspaceId = resolveRailWorkspaceId(
    rail?.activeWorkspaceId ?? null,
    pathname,
    workspaces,
  );
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    if (!workspaceId) {
      setFolders([]);
      return;
    }

    let cancelled = false;
    listFolders(workspaceId)
      .then((result) => {
        if (!cancelled) {
          setFolders(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFolders([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              className="flex h-auto w-full flex-col items-center gap-1 rounded-lg px-1 py-2 text-rail-foreground/70 hover:bg-rail-accent hover:text-rail-foreground"
              aria-label="Create"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <PlusIcon className="size-5" aria-hidden />
              </span>
              <span className="text-[10px] font-medium leading-none">Create</span>
            </Button>
          }
        />
        <DropdownMenuContent side="right" align="end" className="w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>New</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canCreateWorkspace ? (
              <DropdownMenuItem onClick={() => setCreateWorkspaceOpen(true)}>
                <LayoutGridIcon className="size-4" />
                Workspace
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              disabled={!workspaceId}
              onClick={() => workspaceId && setCreateSheetOpen(true)}
            >
              <FileSpreadsheetIcon className="size-4" />
              Sheet
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!workspaceId}
              onClick={() => workspaceId && setCreateFolderOpen(true)}
            >
              <FolderPlusIcon className="size-4" />
              Folder
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceDialog open={createWorkspaceOpen} onOpenChange={setCreateWorkspaceOpen} />

      {workspaceId ? (
        <>
          <CreateSheetDialog
            open={createSheetOpen}
            onOpenChange={setCreateSheetOpen}
            workspaceId={workspaceId}
          />
          <CreateFolderDialog
            open={createFolderOpen}
            onOpenChange={setCreateFolderOpen}
            workspaceId={workspaceId}
            folders={folders}
          />
        </>
      ) : null}
    </>
  );
}
