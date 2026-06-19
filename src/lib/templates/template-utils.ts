import type { Json } from "@/types/database";
import { templateColumnSchema, type TemplateColumnDefinition } from "@/lib/validations/template";

export function parseTemplateColumns(value: Json): TemplateColumnDefinition[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const columns: TemplateColumnDefinition[] = [];

  for (const entry of value) {
    const parsed = templateColumnSchema.safeParse(entry);
    if (parsed.success) {
      columns.push(parsed.data);
    }
  }

  return columns.sort((a, b) => a.position - b.position);
}

export function parseTemplateSeedRows(value: Json | null): Array<Record<string, Json | undefined>> {
  if (!value || !Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is Record<string, Json | undefined> => {
      return typeof entry === "object" && entry !== null && !Array.isArray(entry);
    })
    .map((entry) => entry);
}

export type WorkspaceTreeFolderNode = {
  type: "folder";
  folder: {
    id: string;
    name: string;
    parent_folder_id: string | null;
    position: number;
  };
  folders: WorkspaceTreeFolderNode[];
  sheets: Array<{ id: string; name: string; folder_id: string | null }>;
};

export function buildWorkspaceTree(
  folders: Array<{
    id: string;
    name: string;
    parent_folder_id: string | null;
    position: number;
  }>,
  sheets: Array<{ id: string; name: string; folder_id: string | null; position: number }>,
): {
  folders: WorkspaceTreeFolderNode[];
  sheets: Array<{ id: string; name: string; folder_id: string | null }>;
} {
  const folderMap = new Map<string, WorkspaceTreeFolderNode>();

  for (const folder of folders) {
    folderMap.set(folder.id, {
      type: "folder",
      folder,
      folders: [],
      sheets: [],
    });
  }

  const rootFolders: WorkspaceTreeFolderNode[] = [];
  const rootSheets: Array<{ id: string; name: string; folder_id: string | null }> = [];

  for (const node of folderMap.values()) {
    const parentId = node.folder.parent_folder_id;
    if (parentId && folderMap.has(parentId)) {
      folderMap.get(parentId)!.folders.push(node);
    } else {
      rootFolders.push(node);
    }
  }

  for (const sheet of sheets) {
    if (sheet.folder_id && folderMap.has(sheet.folder_id)) {
      folderMap.get(sheet.folder_id)!.sheets.push(sheet);
    } else {
      rootSheets.push(sheet);
    }
  }

  const sortFolders = (nodes: WorkspaceTreeFolderNode[]) => {
    nodes.sort((a, b) => a.folder.position - b.folder.position || a.folder.name.localeCompare(b.folder.name));
    for (const node of nodes) {
      node.sheets.sort((a, b) => a.name.localeCompare(b.name));
      sortFolders(node.folders);
    }
  };

  sortFolders(rootFolders);
  rootSheets.sort((a, b) => a.name.localeCompare(b.name));

  return { folders: rootFolders, sheets: rootSheets };
}

export const SYSTEM_TEMPLATE_KEYS = [
  "blank",
  "tenant_prospect_list",
  "deal_tracker",
  "contact_database",
] as const;

export type SystemTemplateKey = (typeof SYSTEM_TEMPLATE_KEYS)[number];

export function templateColumnPreview(columns: TemplateColumnDefinition[]): string {
  return columns.map((column) => column.label).join(", ");
}

export function isBlankTemplateKey(key: string): boolean {
  return key === "blank";
}
