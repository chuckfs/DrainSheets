"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileSpreadsheetIcon,
  FolderIcon,
  FolderPlusIcon,
  PlusIcon,
  Share2Icon,
  UploadIcon,
} from "lucide-react";
import type { AccessContext } from "@/lib/access/effective-role";
import {
  buildWorkspaceTree,
  type WorkspaceTreeFolderNode,
} from "@/lib/templates/template-utils";
import type { Folder, Sheet } from "@/types/domain";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/shares/share-dialog";
import { CreateFolderDialog } from "@/components/workspaces/create-folder-dialog";
import { CreateSheetDialog } from "@/components/sheets/create-sheet-dialog";
import { SheetFavoriteButton } from "@/components/sheets/sheet-favorite-button";
import { ImportDialog } from "@/components/import/import-dialog";

function FolderNode({
  node,
  workspaceId,
  folders,
  access,
  activeSheetId,
  depth,
  onRefresh,
  favoriteSheetIds,
}: {
  node: WorkspaceTreeFolderNode;
  workspaceId: string;
  folders: Folder[];
  access: AccessContext;
  activeSheetId?: string;
  depth: number;
  onRefresh: () => void;
  favoriteSheetIds: Set<string>;
}) {
  const [expanded, setExpanded] = useState(true);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const hasChildren = node.folders.length > 0 || node.sheets.length > 0;

  return (
    <li>
      <div
        className="group mx-1 flex items-center gap-1 rounded-md py-1 pr-2 transition-colors hover:bg-accent"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <button
          type="button"
          className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-muted"
          aria-label={expanded ? "Collapse folder" : "Expand folder"}
          onClick={() => setExpanded((value) => !value)}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDownIcon className="size-3.5" />
            ) : (
              <ChevronRightIcon className="size-3.5" />
            )
          ) : (
            <span className="size-3.5" />
          )}
        </button>
        <FolderIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-sm">{node.folder.name}</span>
        {access.canEdit && (
          <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6"
              aria-label="New sheet in folder"
              onClick={() => setCreateSheetOpen(true)}
            >
              <PlusIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6"
              aria-label="Import into folder"
              onClick={() => setImportOpen(true)}
            >
              <UploadIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-6"
              aria-label="New subfolder"
              onClick={() => setCreateFolderOpen(true)}
            >
              <FolderPlusIcon className="size-3.5" />
            </Button>
          </div>
        )}
        {access.canShare && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-6 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
            aria-label="Share folder"
            onClick={() => setShareOpen(true)}
          >
            <Share2Icon className="size-3.5" />
          </Button>
        )}
      </div>

      {expanded && (
        <ul>
          {node.sheets.map((sheet) => (
            <SheetRow
              key={sheet.id}
              sheet={sheet}
              activeSheetId={activeSheetId}
              depth={depth + 1}
              favorited={favoriteSheetIds.has(sheet.id)}
            />
          ))}
          {node.folders.map((child) => (
            <FolderNode
              key={child.folder.id}
              node={child}
              workspaceId={workspaceId}
              folders={folders}
              access={access}
              activeSheetId={activeSheetId}
              depth={depth + 1}
              onRefresh={onRefresh}
              favoriteSheetIds={favoriteSheetIds}
            />
          ))}
        </ul>
      )}

      <CreateSheetDialog
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        workspaceId={workspaceId}
        folderId={node.folder.id}
        onCreated={onRefresh}
      />
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        workspaceId={workspaceId}
        folders={folders}
        parentFolderId={node.folder.id}
        onCreated={onRefresh}
      />
      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        resourceType="folder"
        resourceId={node.folder.id}
        resourceName={node.folder.name}
      />
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        workspaceId={workspaceId}
        folderId={node.folder.id}
        onImported={onRefresh}
      />
    </li>
  );
}

function SheetRow({
  sheet,
  activeSheetId,
  depth,
  favorited,
}: {
  sheet: { id: string; name: string };
  activeSheetId?: string;
  depth: number;
  favorited?: boolean;
}) {
  const active = sheet.id === activeSheetId;

  return (
    <li>
      <div
        className={cn(
          "group mx-1 flex items-center gap-1 rounded-md py-1.5 pr-2 text-sm transition-colors",
          active ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent",
        )}
        style={{ paddingLeft: `${depth * 12 + 28}px` }}
      >
        <Link
          href={`/sheets/${sheet.id}`}
          className="flex min-w-0 flex-1 items-center gap-2"
          aria-current={active ? "page" : undefined}
        >
          <FileSpreadsheetIcon
            className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
          />
          <span className="truncate">{sheet.name}</span>
        </Link>
        <SheetFavoriteButton sheetId={sheet.id} initialFavorited={Boolean(favorited)} />
      </div>
    </li>
  );
}

export function WorkspaceTree({
  workspaceId,
  folders,
  sheets,
  access,
  activeSheetId,
  favoriteSheetIds,
}: {
  workspaceId: string;
  folders: Folder[];
  sheets: Sheet[];
  access: AccessContext;
  activeSheetId?: string;
  favoriteSheetIds?: Set<string>;
}) {
  const router = useRouter();
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const favorites = favoriteSheetIds ?? new Set<string>();

  const tree = useMemo(() => buildWorkspaceTree(folders, sheets), [folders, sheets]);

  function handleRefresh() {
    router.refresh();
  }

  const isEmpty = folders.length === 0 && sheets.length === 0;

  if (isEmpty) {
    return (
      <>
        <EmptyState
          icon={FileSpreadsheetIcon}
          title="No sheets yet"
          description="Create a folder or sheet to start organizing your workspace."
          action={
            access.canEdit ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button type="button" size="sm" onClick={() => setCreateSheetOpen(true)}>
                  Create sheet
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setCreateFolderOpen(true)}>
                  Create folder
                </Button>
              </div>
            ) : undefined
          }
        />
        <CreateSheetDialog
          open={createSheetOpen}
          onOpenChange={setCreateSheetOpen}
          workspaceId={workspaceId}
          onCreated={handleRefresh}
        />
        <CreateFolderDialog
          open={createFolderOpen}
          onOpenChange={setCreateFolderOpen}
          workspaceId={workspaceId}
          folders={folders}
          onCreated={handleRefresh}
        />
      </>
    );
  }

  return (
    <div className="border-x border-b py-1">
      <ul>
        {tree.folders.map((node) => (
          <FolderNode
            key={node.folder.id}
            node={node}
            workspaceId={workspaceId}
            folders={folders}
            access={access}
            activeSheetId={activeSheetId}
            depth={0}
            onRefresh={handleRefresh}
            favoriteSheetIds={favorites}
          />
        ))}
        {tree.sheets.map((sheet) => (
          <SheetRow
            key={sheet.id}
            sheet={sheet}
            activeSheetId={activeSheetId}
            depth={0}
            favorited={favorites.has(sheet.id)}
          />
        ))}
      </ul>
    </div>
  );
}
