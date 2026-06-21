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
  Trash2Icon,
  UploadIcon,
} from "lucide-react";
import { deleteFolder } from "@/actions/folders";
import { deleteSheet } from "@/actions/sheets";
import type { AccessContext } from "@/lib/access/effective-role";
import { countFolderSubtreeContents } from "@/lib/folders/subtree";
import {
  buildWorkspaceTree,
  type WorkspaceTreeFolderNode,
} from "@/lib/templates/template-utils";
import type { Folder, Sheet } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useWorkspaceTreeDnD } from "@/hooks/use-workspace-tree-dnd";
import { isInteractiveDragTarget } from "@/lib/workspaces/tree-dnd";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/shares/share-dialog";
import { CreateFolderDialog } from "@/components/workspaces/create-folder-dialog";
import { CreateSheetDialog } from "@/components/sheets/create-sheet-dialog";
import { SheetFavoriteButton } from "@/components/sheets/sheet-favorite-button";
import { ImportDialog } from "@/components/import/import-dialog";
import { DeleteResourceDialog } from "@/components/workspaces/delete-resource-dialog";
import { TreeItemOverflowMenu } from "@/components/workspaces/tree-item-overflow-menu";
import { toast } from "sonner";

type TreeDnD = ReturnType<typeof useWorkspaceTreeDnD>;

function buildFolderDeleteDescription(
  folderName: string,
  subfolderCount: number,
  sheetCount: number,
): string {
  const parts = [`Delete “${folderName}”?`];

  if (subfolderCount === 0 && sheetCount === 0) {
    parts.push("This folder is empty and will be permanently removed.");
  } else {
    const details: string[] = [];
    if (subfolderCount > 0) {
      details.push(`${subfolderCount} subfolder${subfolderCount === 1 ? "" : "s"}`);
    }
    if (sheetCount > 0) {
      details.push(`${sheetCount} sheet${sheetCount === 1 ? "" : "s"}`);
    }
    parts.push(`This will permanently delete ${details.join(" and ")}.`);
  }

  parts.push("This cannot be undone.");
  return parts.join(" ");
}

function FolderNode({
  node,
  workspaceId,
  folders,
  sheets,
  access,
  activeSheetId,
  depth,
  onRefresh,
  favoriteSheetIds,
  dnd,
}: {
  node: WorkspaceTreeFolderNode;
  workspaceId: string;
  folders: Folder[];
  sheets: Sheet[];
  access: AccessContext;
  activeSheetId?: string;
  depth: number;
  onRefresh: () => void;
  favoriteSheetIds: Set<string>;
  dnd: TreeDnD;
}) {
  const [expanded, setExpanded] = useState(true);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const hasChildren = node.folders.length > 0 || node.sheets.length > 0;

  const folderHierarchy = useMemo(
    () => folders.map((folder) => ({ id: folder.id, parent_folder_id: folder.parent_folder_id })),
    [folders],
  );
  const { subfolderCount, sheetCount } = useMemo(
    () =>
      countFolderSubtreeContents(
        node.folder.id,
        folderHierarchy,
        sheets.map((sheet) => sheet.folder_id),
      ),
    [folderHierarchy, node.folder.id, sheets],
  );

  async function handleDeleteFolder(): Promise<boolean> {
    const result = await deleteFolder(node.folder.id);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    toast.success("Folder deleted");
    onRefresh();
    return true;
  }

  const isDropTarget = dnd.isFolderDropTarget(node.folder.id);
  const isDraggingSelf =
    dnd.dragging?.type === "folder" && dnd.dragging.id === node.folder.id;

  return (
    <li>
      <div
        draggable={dnd.canEdit}
        className={cn(
          "group mx-1 flex items-center gap-1 rounded-md py-1 pr-2 transition-colors hover:bg-accent",
          isDropTarget && "bg-primary/15 ring-2 ring-inset ring-primary",
          isDraggingSelf && "opacity-50",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onDragStart={(event) => {
          if (isInteractiveDragTarget(event.target)) {
            event.preventDefault();
            return;
          }
          dnd.handleDragStart(event, { type: "folder", id: node.folder.id });
        }}
        onDragEnd={dnd.handleDragEnd}
        onDragOver={(event) => dnd.handleFolderDragOver(event, node.folder.id)}
        onDragLeave={dnd.handleDragLeave}
        onDrop={(event) => dnd.handleDropOnFolder(event, node.folder.id)}
      >
        <button
          type="button"
          className="flex size-5 shrink-0 items-center justify-center rounded hover:bg-muted"
          aria-label={expanded ? "Collapse folder" : "Expand folder"}
          data-no-tree-drag
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
              data-no-tree-drag
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
              data-no-tree-drag
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
              data-no-tree-drag
              onClick={() => setCreateFolderOpen(true)}
            >
              <FolderPlusIcon className="size-3.5" />
            </Button>
          </div>
        )}
        {access.canShare && (
          <TreeItemOverflowMenu
            items={[
              {
                id: "share",
                label: "Share folder",
                icon: <Share2Icon className="size-3.5" />,
                onSelect: () => setShareOpen(true),
              },
              {
                id: "delete",
                label: "Delete folder",
                icon: <Trash2Icon className="size-3.5" />,
                destructive: true,
                separatorBefore: true,
                onSelect: () => setDeleteOpen(true),
              },
            ]}
          />
        )}
      </div>

      {expanded && (
        <ul>
          {node.sheets.map((sheet) => (
            <SheetRow
              key={sheet.id}
              sheet={sheet}
              workspaceId={workspaceId}
              access={access}
              activeSheetId={activeSheetId}
              depth={depth + 1}
              favorited={favoriteSheetIds.has(sheet.id)}
              onRefresh={onRefresh}
              dnd={dnd}
            />
          ))}
          {node.folders.map((child) => (
            <FolderNode
              key={child.folder.id}
              node={child}
              workspaceId={workspaceId}
              folders={folders}
              sheets={sheets}
              access={access}
              activeSheetId={activeSheetId}
              depth={depth + 1}
              onRefresh={onRefresh}
              favoriteSheetIds={favoriteSheetIds}
              dnd={dnd}
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
      <DeleteResourceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete folder"
        description={buildFolderDeleteDescription(node.folder.name, subfolderCount, sheetCount)}
        confirmLabel="Delete folder"
        onConfirm={handleDeleteFolder}
      />
    </li>
  );
}

function SheetRow({
  sheet,
  workspaceId,
  access,
  activeSheetId,
  depth,
  favorited,
  onRefresh,
  dnd,
}: {
  sheet: { id: string; name: string };
  workspaceId: string;
  access: AccessContext;
  activeSheetId?: string;
  depth: number;
  favorited?: boolean;
  onRefresh: () => void;
  dnd: TreeDnD;
}) {
  const router = useRouter();
  const active = sheet.id === activeSheetId;
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isDraggingSelf = dnd.dragging?.type === "sheet" && dnd.dragging.id === sheet.id;

  async function handleDeleteSheet(): Promise<boolean> {
    const result = await deleteSheet(sheet.id);
    if (!result.success) {
      toast.error(result.error);
      return false;
    }

    toast.success("Sheet deleted");
    if (active) {
      router.push(`/workspaces/${workspaceId}`);
    } else {
      router.refresh();
    }
    return true;
  }

  return (
    <li>
      <div
        draggable={dnd.canEdit}
        className={cn(
          "group mx-1 flex items-center gap-1 rounded-md py-1.5 pr-2 text-sm transition-colors",
          active ? "bg-primary/10 font-medium text-primary" : "hover:bg-accent",
          isDraggingSelf && "opacity-50",
        )}
        style={{ paddingLeft: `${depth * 12 + 28}px` }}
        onDragStart={(event) => {
          if (isInteractiveDragTarget(event.target)) {
            event.preventDefault();
            return;
          }
          dnd.handleDragStart(event, { type: "sheet", id: sheet.id });
        }}
        onDragEnd={dnd.handleDragEnd}
      >
        <Link
          href={`/sheets/${sheet.id}`}
          className="flex min-w-0 flex-1 items-center gap-2"
          aria-current={active ? "page" : undefined}
          data-no-tree-drag
          draggable={false}
        >
          <FileSpreadsheetIcon
            className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
          />
          <span className="truncate">{sheet.name}</span>
        </Link>
        <div className="flex shrink-0 items-center" data-no-tree-drag>
          <SheetFavoriteButton sheetId={sheet.id} initialFavorited={Boolean(favorited)} />
          {access.canShare && (
            <div className="max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity] duration-150 ease-out group-hover:max-w-6 group-hover:opacity-100 group-focus-within:max-w-6 group-focus-within:opacity-100 max-sm:max-w-6 max-sm:opacity-100">
              <TreeItemOverflowMenu
                triggerClassName="opacity-100"
                items={[
                  {
                    id: "share",
                    label: "Share sheet",
                    icon: <Share2Icon className="size-3.5" />,
                    onSelect: () => setShareOpen(true),
                  },
                  {
                    id: "delete",
                    label: "Delete sheet",
                    icon: <Trash2Icon className="size-3.5" />,
                    destructive: true,
                    separatorBefore: true,
                    onSelect: () => setDeleteOpen(true),
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        resourceType="sheet"
        resourceId={sheet.id}
        resourceName={sheet.name}
      />
      <DeleteResourceDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete sheet"
        description={`Delete “${sheet.name}”? All rows, columns, and attachments will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete sheet"
        onConfirm={handleDeleteSheet}
      />
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
  const folderHierarchy = useMemo(
    () => folders.map((folder) => ({ id: folder.id, parent_folder_id: folder.parent_folder_id })),
    [folders],
  );

  function handleRefresh() {
    router.refresh();
  }

  const dnd = useWorkspaceTreeDnD({
    canEdit: access.canEdit,
    folders: folderHierarchy,
    sheets,
    onRefresh: handleRefresh,
  });

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
    <div
      className={cn(
        "border-x border-b py-1",
        dnd.isMoving && "pointer-events-none opacity-70",
        dnd.isRootDropTarget && "bg-primary/5",
      )}
      onDragOver={dnd.canEdit ? dnd.handleRootDragOver : undefined}
      onDragLeave={dnd.canEdit ? dnd.handleDragLeave : undefined}
      onDrop={dnd.canEdit ? dnd.handleDropOnRoot : undefined}
    >
      <ul>
        {tree.folders.map((node) => (
          <FolderNode
            key={node.folder.id}
            node={node}
            workspaceId={workspaceId}
            folders={folders}
            sheets={sheets}
            access={access}
            activeSheetId={activeSheetId}
            depth={0}
            onRefresh={handleRefresh}
            favoriteSheetIds={favorites}
            dnd={dnd}
          />
        ))}
        {tree.sheets.map((sheet) => (
          <SheetRow
            key={sheet.id}
            sheet={sheet}
            workspaceId={workspaceId}
            access={access}
            activeSheetId={activeSheetId}
            depth={0}
            favorited={favorites.has(sheet.id)}
            onRefresh={handleRefresh}
            dnd={dnd}
          />
        ))}
      </ul>
    </div>
  );
}
