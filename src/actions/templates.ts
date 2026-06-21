"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { logActivityEvent } from "@/lib/activity/log-event";
import { requireProfile } from "@/lib/auth/guards";
import {
  parseTemplateColumns,
  parseTemplateSeedRows,
} from "@/lib/templates/template-utils";
import { BLANK_SHEET_COLUMNS, BLANK_SHEET_SEED_ROWS } from "@/lib/sheets/blank-sheet";
import { createClient } from "@/lib/supabase/server";
import {
  createBlankSheetSchema,
  createSheetFromTemplateSchema,
  type TemplateColumnDefinition,
} from "@/lib/validations/template";
import type { Json } from "@/types/database";
import type { Sheet, SheetTemplate, SheetTemplateVersion } from "@/types/domain";

export type TemplateWithVersion = SheetTemplate & {
  version: SheetTemplateVersion;
};

export type SheetTemplateProvenance =
  | { kind: "blank" }
  | { kind: "template"; name: string; version: number };

async function nextSheetPosition(
  workspaceId: string,
  folderId: string | null,
): Promise<number> {
  const supabase = await createClient();

  let query = supabase
    .from("sheets")
    .select("position")
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: false })
    .limit(1);

  query = folderId ? query.eq("folder_id", folderId) : query.is("folder_id", null);

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.position ?? -1) + 1;
}

async function instantiateSheet({
  workspaceId,
  folderId,
  name,
  description,
  templateId,
  templateVersion,
  columns,
  seedRows,
}: {
  workspaceId: string;
  folderId: string | null;
  name: string;
  description?: string;
  templateId: string | null;
  templateVersion: number | null;
  columns: TemplateColumnDefinition[];
  seedRows: Array<Record<string, Json | undefined>>;
}): Promise<ActionResult<{ sheetId: string }>> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const position = await nextSheetPosition(workspaceId, folderId);

  const { data: sheet, error: sheetError } = await supabase
    .from("sheets")
    .insert({
      org_id: profile.org_id,
      workspace_id: workspaceId,
      folder_id: folderId,
      name,
      description: description ?? null,
      template_id: templateId,
      template_version: templateVersion,
      position,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (sheetError) {
    return actionError(sheetError.message);
  }

  if (columns.length > 0) {
    const { error: columnsError } = await supabase.from("sheet_columns").insert(
      columns.map((column) => ({
        sheet_id: sheet.id,
        org_id: profile.org_id,
        key: column.key,
        label: column.label,
        type: column.type,
        position: column.position,
        is_primary: column.is_primary,
        is_pinned: column.is_pinned,
        width: column.width,
        config: (column.config ?? {}) as Json,
      })),
    );

    if (columnsError) {
      await supabase.from("sheets").delete().eq("id", sheet.id);
      return actionError(columnsError.message);
    }
  }

  if (seedRows.length > 0) {
    const { error: rowsError } = await supabase.from("rows").insert(
      seedRows.map((data, index) => ({
        sheet_id: sheet.id,
        org_id: profile.org_id,
        position: index,
        data: data as Json,
        created_by: profile.id,
      })),
    );

    if (rowsError) {
      await supabase.from("sheet_columns").delete().eq("sheet_id", sheet.id);
      await supabase.from("sheets").delete().eq("id", sheet.id);
      return actionError(rowsError.message);
    }
  }

  revalidatePath(`/workspaces/${workspaceId}`);
  revalidatePath(`/sheets/${sheet.id}`);

  await logActivityEvent({
    entityType: "sheet",
    entityId: sheet.id,
    action: "created",
    workspaceId,
    sheetId: sheet.id,
    metadata: { sheet_name: name },
  });

  return actionSuccess({ sheetId: sheet.id });
}

export async function listTemplates(): Promise<SheetTemplate[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sheet_templates")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getTemplate(templateId: string): Promise<SheetTemplate | null> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sheet_templates")
    .select("*")
    .eq("id", templateId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getTemplateVersions(templateId: string): Promise<SheetTemplateVersion[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sheet_template_versions")
    .select("*")
    .eq("template_id", templateId)
    .order("version", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getTemplateWithVersion(
  templateId: string,
  version?: number,
): Promise<TemplateWithVersion | null> {
  const template = await getTemplate(templateId);
  if (!template) {
    return null;
  }

  const targetVersion = version ?? template.current_version;
  const supabase = await createClient();

  const { data: versionRow, error } = await supabase
    .from("sheet_template_versions")
    .select("*")
    .eq("template_id", templateId)
    .eq("version", targetVersion)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!versionRow) {
    return null;
  }

  return { ...template, version: versionRow };
}

export async function createBlankSheet(input: {
  workspaceId: string;
  folderId?: string | null;
  name: string;
  description?: string;
}): Promise<ActionResult<{ sheetId: string }>> {
  const parsed = createBlankSheetSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid sheet");
  }

  return instantiateSheet({
    workspaceId: parsed.data.workspaceId,
    folderId: parsed.data.folderId ?? null,
    name: parsed.data.name.trim(),
    description: parsed.data.description,
    templateId: null,
    templateVersion: null,
    columns: BLANK_SHEET_COLUMNS,
    seedRows: BLANK_SHEET_SEED_ROWS,
  });
}

export async function createSheetFromTemplate(input: {
  templateId: string;
  workspaceId: string;
  folderId?: string | null;
  name: string;
  description?: string;
  version?: number;
}): Promise<ActionResult<{ sheetId: string }>> {
  const parsed = createSheetFromTemplateSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid sheet");
  }

  const templateWithVersion = await getTemplateWithVersion(
    parsed.data.templateId,
    parsed.data.version,
  );

  if (!templateWithVersion) {
    return actionError("Template version not found");
  }

  const columns = parseTemplateColumns(templateWithVersion.version.columns);
  const seedRows = parseTemplateSeedRows(templateWithVersion.version.seed_rows);

  return instantiateSheet({
    workspaceId: parsed.data.workspaceId,
    folderId: parsed.data.folderId ?? null,
    name: parsed.data.name.trim(),
    description: parsed.data.description,
    templateId: templateWithVersion.id,
    templateVersion: templateWithVersion.version.version,
    columns,
    seedRows,
  });
}

export async function getSheetTemplateProvenance(sheet: Sheet): Promise<SheetTemplateProvenance> {
  if (!sheet.template_id) {
    return { kind: "blank" };
  }

  const template = await getTemplate(sheet.template_id);

  return {
    kind: "template",
    name: template?.name ?? "Unknown template",
    version: sheet.template_version ?? template?.current_version ?? 1,
  };
}
