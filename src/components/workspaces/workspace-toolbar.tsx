"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2Icon } from "lucide-react";
import type { AccessContext } from "@/lib/access/effective-role";
import type { Folder, Workspace } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { SheetHeader } from "@/components/layout/sheet-header";
import { AccessBadge } from "@/components/shares/access-badge";
import { ShareDialog } from "@/components/shares/share-dialog";

export function WorkspaceToolbar({
  workspace,
  access,
  folders,
  workspaceSwitcher,
}: {
  workspace: Workspace;
  access: AccessContext;
  folders: Folder[];
  workspaceSwitcher?: React.ReactNode;
}) {
  const [workspaceShareOpen, setWorkspaceShareOpen] = useState(false);
  const [folderShareTarget, setFolderShareTarget] = useState<Folder | null>(null);

  return (
    <>
      <SheetHeader
        eyebrow="Workspace"
        title={workspace.name}
        meta={
          <div className="flex flex-wrap items-center gap-2">
            {workspaceSwitcher}
            <AccessBadge access={access} />
          </div>
        }
        actions={
          access.canShare ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              onClick={() => setWorkspaceShareOpen(true)}
            >
              <Share2Icon className="size-3.5" />
              Share workspace
            </Button>
          ) : undefined
        }
      />

      {folders.length > 0 && (
        <div className="border-b px-3 py-2">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Folders
          </p>
          <ul className="space-y-1">
            {folders.map((folder) => (
              <li
                key={folder.id}
                className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-muted/50"
              >
                <span>{folder.name}</span>
                {access.canShare && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 text-xs"
                    onClick={() => setFolderShareTarget(folder)}
                  >
                    <Share2Icon className="size-3" />
                    Share
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ShareDialog
        open={workspaceShareOpen}
        onOpenChange={setWorkspaceShareOpen}
        resourceType="workspace"
        resourceId={workspace.id}
        resourceName={workspace.name}
      />

      {folderShareTarget && (
        <ShareDialog
          open={Boolean(folderShareTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setFolderShareTarget(null);
            }
          }}
          resourceType="folder"
          resourceId={folderShareTarget.id}
          resourceName={folderShareTarget.name}
        />
      )}
    </>
  );
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
}: {
  workspaces: Array<Pick<Workspace, "id" | "name">>;
  activeWorkspaceId: string;
}) {
  if (workspaces.length <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {workspaces.map((item) => (
        <Link
          key={item.id}
          href={`/workspaces/${item.id}`}
          className={
            item.id === activeWorkspaceId
              ? "rounded-md bg-primary px-2 py-0.5 text-[11px] text-primary-foreground"
              : "rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
          }
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
