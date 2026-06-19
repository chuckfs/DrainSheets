"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { filterRowsWithDedupe } from "@/lib/import/dedupe";
import { inferColumns as inferColumnsLib } from "@/lib/import/infer-columns";
import { autoMapToTemplateColumns } from "@/lib/import/mapping";
import { parseImportBuffer } from "@/lib/import/parser";
import { buildImportPreview } from "@/lib/import/preview";
import {
  contactNameFromValue,
  extractEmail,
  findContactEmailInRow,
  isRowEmpty,
  mapRowToSheetData,
} from "@/lib/import/transform";
import type {
  ColumnMappingEntry,
  ImportPreviewSummary,
  ImportRow,
  InferredColumn,
  ParsedImport,
} from "@/lib/import/types";
import { parseTemplateColumns } from "@/lib/templates/template-utils";
import { createClient } from "@/lib/supabase/server";
import {
  createSheetFromImportSchema,
  importIntoTemplateSchema,
  importPreviewSchema,
} from "@/lib/validations/import";
import type { Json } from "@/types/database";
import type { ColumnType } from "@/types/domain";
import { createSheetFromTemplate, getTemplateWithVersion } from "./templates";

const ROW_BATCH_SIZE = 200;

async function nextSheetPosition(workspaceId: string, folderId: string | null): Promise<number> {
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

async function buildOutputRows(
  rows: ImportRow[],
  mapping: Record<string, ColumnMappingEntry>,
  columnTypes: Record<string, ColumnType>,
  dedupe: { enabled: boolean; sourceColumn: string | null },
): Promise<{ sourceRows: ImportRow[]; outputRows: Array<Record<string, Json | undefined>> }> {
  const { rows: dedupedRows } = filterRowsWithDedupe(rows, dedupe.sourceColumn, dedupe.enabled);

  const sourceRows: ImportRow[] = [];
  const outputRows: Array<Record<string, Json | undefined>> = [];

  for (const row of dedupedRows) {
    const data = mapRowToSheetData(row, mapping, columnTypes);
    if (!isRowEmpty(data)) {
      sourceRows.push(row);
      outputRows.push(data);
    }
  }

  return { sourceRows, outputRows };
}

export async function parseImportFile(formData: FormData): Promise<ActionResult<ParsedImport>> {
  await requireProfile();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return actionError("No file uploaded");
  }

  const buffer = await file.arrayBuffer();
  const result = parseImportBuffer(buffer, file.name);

  if (!result.success) {
    return actionError(result.error);
  }

  if (result.data.columns.length === 0) {
    return actionError("Import file has no columns");
  }

  return actionSuccess(result.data);
}

export async function inferColumns(
  headers: string[],
  rows: ImportRow[],
): Promise<InferredColumn[]> {
  await requireProfile();
  return inferColumnsLib(headers, rows);
}

export async function buildTemplateMapping(
  templateId: string,
  sourceHeaders: string[],
): Promise<ActionResult<Record<string, ColumnMappingEntry>>> {
  await requireProfile();

  const template = await getTemplateWithVersion(templateId);
  if (!template) {
    return actionError("Template not found");
  }

  const columns = parseTemplateColumns(template.version.columns);
  const mapping = autoMapToTemplateColumns(sourceHeaders, columns);

  return actionSuccess(mapping);
}

export async function previewImport(input: {
  mapping: Record<string, ColumnMappingEntry>;
  columnTypes: Record<string, ColumnType>;
  rows: ImportRow[];
  dedupe: { enabled: boolean; sourceColumn: string | null };
}): Promise<ActionResult<ImportPreviewSummary>> {
  await requireProfile();

  const parsed = importPreviewSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid preview input");
  }

  const preview = buildImportPreview(parsed.data);
  return actionSuccess(preview);
}

async function resolveContactId(
  email: string,
  displayValue: ImportRow[string],
  cache: Map<string, string>,
): Promise<string | null> {
  const normalizedEmail = email.toLowerCase();
  const cached = cache.get(normalizedEmail);
  if (cached) {
    return cached;
  }

  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: existing, error: lookupError } = await supabase
    .from("contacts")
    .select("id")
    .eq("org_id", profile.org_id)
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (existing?.id) {
    cache.set(normalizedEmail, existing.id);
    return existing.id;
  }

  const { firstName, lastName } = contactNameFromValue(displayValue, normalizedEmail);

  const { data: created, error: createError } = await supabase
    .from("contacts")
    .insert({
      org_id: profile.org_id,
      first_name: firstName,
      last_name: lastName,
      email: normalizedEmail,
      created_by: profile.id,
      updated_by: profile.id,
    })
    .select("id")
    .single();

  if (createError) {
    throw new Error(createError.message);
  }

  cache.set(normalizedEmail, created.id);
  return created.id;
}

async function applyContactResolution(
  rows: ImportRow[],
  mapping: Record<string, ColumnMappingEntry>,
  columnTypes: Record<string, ColumnType>,
  outputRows: Array<Record<string, Json | undefined>>,
): Promise<void> {
  const cache = new Map<string, string>();
  const contactKeys = Object.values(mapping)
    .filter((entry) => entry.targetKey && columnTypes[entry.targetKey] === "contact")
    .map((entry) => entry.targetKey!)
    .filter(Boolean);

  if (contactKeys.length === 0) {
    return;
  }

  for (let index = 0; index < rows.length; index += 1) {
    const sourceRow = rows[index];
    const targetRow = outputRows[index];
    if (!sourceRow || !targetRow) {
      continue;
    }

    const rowEmail = findContactEmailInRow(sourceRow, mapping, columnTypes);

    for (const contactKey of contactKeys) {
      const mappingEntry = Object.values(mapping).find((entry) => entry.targetKey === contactKey);
      if (!mappingEntry) {
        continue;
      }

      const rawValue = sourceRow[mappingEntry.sourceHeader];
      const email = extractEmail(rawValue) ?? rowEmail;
      if (!email) {
        targetRow[contactKey] = undefined;
        continue;
      }

      const contactId = await resolveContactId(email, rawValue, cache);
      if (contactId) {
        targetRow[contactKey] = contactId;
      }
    }
  }
}

async function insertRowsBatched(
  sheetId: string,
  orgId: string,
  profileId: string,
  rows: Array<Record<string, Json | undefined>>,
): Promise<void> {
  const supabase = await createClient();

  for (let offset = 0; offset < rows.length; offset += ROW_BATCH_SIZE) {
    const batch = rows.slice(offset, offset + ROW_BATCH_SIZE).map((data, index) => ({
      sheet_id: sheetId,
      org_id: orgId,
      position: offset + index,
      data: data as Json,
      created_by: profileId,
    }));

    const { error } = await supabase.from("rows").insert(batch);
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function createSheetFromImport(input: {
  workspaceId: string;
  folderId?: string | null;
  sheetName: string;
  mapping: Record<string, ColumnMappingEntry>;
  inferredColumns: InferredColumn[];
  rows: ImportRow[];
  dedupe: { enabled: boolean; sourceColumn: string | null };
}): Promise<ActionResult<{ sheetId: string; importedRows: number }>> {
  const profile = await requireProfile();
  const parsed = createSheetFromImportSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid import");
  }

  const supabase = await createClient();
  const folderId = parsed.data.folderId ?? null;
  const position = await nextSheetPosition(parsed.data.workspaceId, folderId);

  const { data: sheet, error: sheetError } = await supabase
    .from("sheets")
    .insert({
      org_id: profile.org_id,
      workspace_id: parsed.data.workspaceId,
      folder_id: folderId,
      name: parsed.data.sheetName.trim(),
      template_id: null,
      template_version: null,
      position,
      created_by: profile.id,
    })
    .select("id")
    .single();

  if (sheetError) {
    return actionError(sheetError.message);
  }

  const columnTypes: Record<string, ColumnType> = {};
  const columnsToInsert = parsed.data.inferredColumns
    .filter((column) =>
      Object.values(parsed.data.mapping).some(
        (entry) => entry.targetKey === column.key && entry.targetKey !== null,
      ),
    )
    .map((column) => {
      const override = Object.values(parsed.data.mapping).find(
        (entry) => entry.targetKey === column.key,
      )?.typeOverride;
      const type = override ?? column.type;
      columnTypes[column.key] = type;

      return {
        sheet_id: sheet.id,
        org_id: profile.org_id,
        key: column.key,
        label: column.label,
        type,
        position: column.position,
        is_primary: column.isPrimary,
        is_pinned: column.isPrimary,
        width: null,
        config: {} as Json,
      };
    });

  if (columnsToInsert.length > 0) {
    const { error: columnsError } = await supabase.from("sheet_columns").insert(columnsToInsert);
    if (columnsError) {
      await supabase.from("sheets").delete().eq("id", sheet.id);
      return actionError(columnsError.message);
    }
  }

  const { sourceRows, outputRows } = await buildOutputRows(
    parsed.data.rows,
    parsed.data.mapping,
    columnTypes,
    parsed.data.dedupe,
  );

  try {
    await applyContactResolution(sourceRows, parsed.data.mapping, columnTypes, outputRows);
    await insertRowsBatched(sheet.id, profile.org_id, profile.id, outputRows);
  } catch (error) {
    await supabase.from("sheet_columns").delete().eq("sheet_id", sheet.id);
    await supabase.from("sheets").delete().eq("id", sheet.id);
    return actionError(error instanceof Error ? error.message : "Import failed");
  }

  revalidatePath(`/workspaces/${parsed.data.workspaceId}`);
  revalidatePath(`/sheets/${sheet.id}`);

  return actionSuccess({ sheetId: sheet.id, importedRows: outputRows.length });
}

export async function importIntoTemplate(input: {
  workspaceId: string;
  folderId?: string | null;
  sheetName: string;
  templateId: string;
  mapping: Record<string, ColumnMappingEntry>;
  rows: ImportRow[];
  dedupe: { enabled: boolean; sourceColumn: string | null };
}): Promise<ActionResult<{ sheetId: string; importedRows: number }>> {
  await requireProfile();
  const parsed = importIntoTemplateSchema.safeParse(input);

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid template import");
  }

  const template = await getTemplateWithVersion(parsed.data.templateId);
  if (!template) {
    return actionError("Template not found");
  }

  const templateColumns = parseTemplateColumns(template.version.columns);
  const columnTypes = Object.fromEntries(templateColumns.map((column) => [column.key, column.type])) as Record<
    string,
    ColumnType
  >;

  const sheetResult = await createSheetFromTemplate({
    workspaceId: parsed.data.workspaceId,
    folderId: parsed.data.folderId ?? null,
    name: parsed.data.sheetName.trim(),
    templateId: parsed.data.templateId,
  });

  if (!sheetResult.success || !sheetResult.data?.sheetId) {
    return actionError(!sheetResult.success ? sheetResult.error : "Failed to create sheet from template");
  }

  const sheetId = sheetResult.data.sheetId;
  const profile = await requireProfile();

  const { sourceRows, outputRows } = await buildOutputRows(
    parsed.data.rows,
    parsed.data.mapping,
    columnTypes,
    parsed.data.dedupe,
  );

  try {
    await applyContactResolution(sourceRows, parsed.data.mapping, columnTypes, outputRows);
    await insertRowsBatched(sheetId, profile.org_id, profile.id, outputRows);
  } catch (error) {
    return actionError(error instanceof Error ? error.message : "Import failed");
  }

  revalidatePath(`/workspaces/${parsed.data.workspaceId}`);
  revalidatePath(`/sheets/${sheetId}`);

  return actionSuccess({ sheetId, importedRows: outputRows.length });
}
