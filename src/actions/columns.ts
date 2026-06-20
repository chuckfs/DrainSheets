"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { getSheetActivityContext, logActivityEvent } from "@/lib/activity/log-event";
import { requireProfile } from "@/lib/auth/guards";
import { uniqueColumnKey } from "@/lib/sheets/column-key";
import { createClient } from "@/lib/supabase/server";
import {
  createColumnSchema,
  deleteColumnSchema,
  moveColumnSchema,
  unhideAllColumnsSchema,
  updateColumnConfigSchema,
  updateColumnHiddenSchema,
  updateColumnLabelSchema,
  updateColumnNumericConfigSchema,
  updateColumnTypeSchema,
  updateColumnWidthSchema,
} from "@/lib/validations/column";
import type { ColumnType, Row, SheetColumn } from "@/types/domain";
import { getDefaultColumnWidth } from "@/lib/sheets/column-widths";
import { selectOptionsToConfig, type SelectOptionConfig } from "@/lib/sheets/select-options";
import { buildNumericConfig, defaultConfigForType } from "@/lib/sheets/column-config";
import { coerceColumnValues } from "@/lib/sheets/coerce-column-type";
import { batchUpdateRows } from "@/actions/rows";
import type { Json } from "@/types/database";

export async function listColumns(sheetId: string): Promise<SheetColumn[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sheet_columns")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createColumn(
  sheetId: string,
  label: string,
  type: ColumnType = "text",
): Promise<ActionResult<SheetColumn>> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: existingColumns, error: listError } = await supabase
    .from("sheet_columns")
    .select("key, position")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: true });

  if (listError) {
    return actionError(listError.message);
  }

  const keys = (existingColumns ?? []).map((column) => column.key);
  const nextPosition =
    existingColumns && existingColumns.length > 0
      ? (existingColumns[existingColumns.length - 1]?.position ?? -1) + 1
      : 0;

  const parsed = createColumnSchema.safeParse({
    sheetId,
    key: uniqueColumnKey(label, keys),
    label: label.trim(),
    type,
    position: nextPosition,
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid column");
  }

  const { data: column, error } = await supabase
    .from("sheet_columns")
    .insert({
      sheet_id: sheetId,
      org_id: profile.org_id,
      key: parsed.data.key,
      label: parsed.data.label,
      type: parsed.data.type,
      position: parsed.data.position,
      width: getDefaultColumnWidth(type),
      is_primary: (existingColumns ?? []).length === 0,
      is_pinned: false,
      config: type === "select" ? ({ options: [] } as Json) : {},
    })
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(sheetId);
  if (context) {
    await logActivityEvent({
      entityType: "column",
      entityId: column.id,
      action: "created",
      workspaceId: context.workspaceId,
      sheetId,
      metadata: { column_label: column.label },
    });
  }

  revalidatePath(`/sheets/${sheetId}`);
  return actionSuccess(column);
}

export async function updateColumnLabel(
  columnId: string,
  label: string,
): Promise<ActionResult<SheetColumn>> {
  await requireProfile();
  const parsed = updateColumnLabelSchema.safeParse({ columnId, label: label.trim() });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid column label");
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("sheet_columns")
    .select("label, sheet_id")
    .eq("id", columnId)
    .single();

  if (existingError) {
    return actionError(existingError.message);
  }

  const { data: column, error } = await supabase
    .from("sheet_columns")
    .update({ label: parsed.data.label })
    .eq("id", columnId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(column.sheet_id);
  if (context) {
    await logActivityEvent({
      entityType: "column",
      entityId: column.id,
      action: "renamed",
      workspaceId: context.workspaceId,
      sheetId: column.sheet_id,
      metadata: { column_label: column.label, previous_label: existing.label },
    });
  }

  revalidatePath(`/sheets/${column.sheet_id}`);
  return actionSuccess(column);
}

export async function moveColumn(
  columnId: string,
  direction: "left" | "right",
): Promise<ActionResult<SheetColumn[]>> {
  await requireProfile();
  const parsed = moveColumnSchema.safeParse({ columnId, direction });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid move");
  }

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("sheet_columns")
    .select("*")
    .eq("id", columnId)
    .single();

  if (currentError) {
    return actionError(currentError.message);
  }

  const { data: siblings, error: siblingsError } = await supabase
    .from("sheet_columns")
    .select("*")
    .eq("sheet_id", current.sheet_id)
    .order("position", { ascending: true });

  if (siblingsError || !siblings) {
    return actionError(siblingsError?.message ?? "Failed to load columns");
  }

  const currentIndex = siblings.findIndex((column) => column.id === columnId);
  const targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
    return actionSuccess(siblings);
  }

  const target = siblings[targetIndex];
  if (!target) {
    return actionSuccess(siblings);
  }

  const currentPosition = current.position;
  const targetPosition = target.position;

  const { error: firstError } = await supabase
    .from("sheet_columns")
    .update({ position: targetPosition })
    .eq("id", current.id);

  if (firstError) {
    return actionError(firstError.message);
  }

  const { error: secondError } = await supabase
    .from("sheet_columns")
    .update({ position: currentPosition })
    .eq("id", target.id);

  if (secondError) {
    return actionError(secondError.message);
  }

  const { data: updated, error: reloadError } = await supabase
    .from("sheet_columns")
    .select("*")
    .eq("sheet_id", current.sheet_id)
    .order("position", { ascending: true });

  if (reloadError) {
    return actionError(reloadError.message);
  }

  const context = await getSheetActivityContext(current.sheet_id);
  if (context) {
    await logActivityEvent({
      entityType: "column",
      entityId: current.id,
      action: "moved",
      workspaceId: context.workspaceId,
      sheetId: current.sheet_id,
      metadata: { column_label: current.label, direction: parsed.data.direction },
    });
  }

  revalidatePath(`/sheets/${current.sheet_id}`);
  return actionSuccess(updated ?? []);
}

export async function updateColumnConfig(
  columnId: string,
  options: SelectOptionConfig[],
): Promise<ActionResult<SheetColumn>> {
  await requireProfile();
  const parsed = updateColumnConfigSchema.safeParse({
    columnId,
    config: { options },
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid column config");
  }

  const supabase = await createClient();
  const config = selectOptionsToConfig(parsed.data.config.options);

  const { data: column, error } = await supabase
    .from("sheet_columns")
    .update({ config })
    .eq("id", columnId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${column.sheet_id}`);
  return actionSuccess(column);
}

export async function updateColumnNumericConfig(
  columnId: string,
  decimals: number,
): Promise<ActionResult<SheetColumn>> {
  await requireProfile();
  const parsed = updateColumnNumericConfigSchema.safeParse({ columnId, decimals });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid column config");
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("sheet_columns")
    .select("*")
    .eq("id", columnId)
    .single();

  if (existingError) {
    return actionError(existingError.message);
  }

  if (existing.type !== "number" && existing.type !== "currency") {
    return actionError("Decimal places apply only to number and currency columns");
  }

  const config = buildNumericConfig(existing, parsed.data.decimals);
  const { data: column, error } = await supabase
    .from("sheet_columns")
    .update({ config })
    .eq("id", columnId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${column.sheet_id}`);
  return actionSuccess(column);
}

export async function updateColumnHidden(
  columnId: string,
  isHidden: boolean,
): Promise<ActionResult<SheetColumn>> {
  await requireProfile();
  const parsed = updateColumnHiddenSchema.safeParse({ columnId, isHidden });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid column");
  }

  const supabase = await createClient();
  const { data: column, error } = await supabase
    .from("sheet_columns")
    .update({ is_hidden: parsed.data.isHidden })
    .eq("id", columnId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${column.sheet_id}`);
  return actionSuccess(column);
}

export async function unhideAllColumns(sheetId: string): Promise<ActionResult<{ updated: number }>> {
  await requireProfile();
  const parsed = unhideAllColumnsSchema.safeParse({ sheetId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid sheet");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sheet_columns")
    .update({ is_hidden: false })
    .eq("sheet_id", parsed.data.sheetId)
    .eq("is_hidden", true)
    .select("id");

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${parsed.data.sheetId}`);
  return actionSuccess({ updated: data?.length ?? 0 });
}

async function listAllRowsForColumnCoercion(sheetId: string): Promise<Row[]> {
  const supabase = await createClient();
  const rows: Row[] = [];
  let offset = 0;
  const batchSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from("rows")
      .select("*")
      .eq("sheet_id", sheetId)
      .order("position", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);
    if (data.length < batchSize) {
      break;
    }

    offset += batchSize;
  }

  return rows;
}

export async function updateColumnType(
  columnId: string,
  type: ColumnType,
): Promise<ActionResult<SheetColumn>> {
  await requireProfile();
  const parsed = updateColumnTypeSchema.safeParse({ columnId, type });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid column type");
  }

  const supabase = await createClient();
  const { data: column, error: columnError } = await supabase
    .from("sheet_columns")
    .select("*")
    .eq("id", columnId)
    .single();

  if (columnError) {
    return actionError(columnError.message);
  }

  if (column.type === parsed.data.type) {
    return actionSuccess(column);
  }

  const rows = await listAllRowsForColumnCoercion(column.sheet_id);
  const updates = coerceColumnValues(rows, column.key, parsed.data.type);

  if (updates.length > 0) {
    const batchResult = await batchUpdateRows(
      updates.map((entry) => ({ rowId: entry.rowId, data: entry.data })),
      { operation: "column_type_change", sheetId: column.sheet_id },
    );

    if (!batchResult.success) {
      return actionError(batchResult.error);
    }
  }

  const { data: updated, error } = await supabase
    .from("sheet_columns")
    .update({
      type: parsed.data.type,
      config: defaultConfigForType(parsed.data.type),
      width: getDefaultColumnWidth(parsed.data.type),
    })
    .eq("id", columnId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(column.sheet_id);
  if (context) {
    await logActivityEvent({
      entityType: "column",
      entityId: column.id,
      action: "updated",
      workspaceId: context.workspaceId,
      sheetId: column.sheet_id,
      metadata: { column_label: column.label, column_type: parsed.data.type },
    });
  }

  revalidatePath(`/sheets/${column.sheet_id}`);
  return actionSuccess(updated);
}

export async function updateColumnWidth(
  columnId: string,
  width: number,
): Promise<ActionResult<SheetColumn>> {
  await requireProfile();
  const parsed = updateColumnWidthSchema.safeParse({ columnId, width });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid column width");
  }

  const supabase = await createClient();
  const { data: column, error } = await supabase
    .from("sheet_columns")
    .update({ width: parsed.data.width })
    .eq("id", columnId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${column.sheet_id}`);
  return actionSuccess(column);
}

export async function updateColumnPinned(
  columnId: string,
  isPinned: boolean,
): Promise<ActionResult<SheetColumn>> {
  await requireProfile();
  const supabase = await createClient();

  const { data: column, error } = await supabase
    .from("sheet_columns")
    .update({ is_pinned: isPinned })
    .eq("id", columnId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${column.sheet_id}`);
  return actionSuccess(column);
}

export async function deleteColumn(columnId: string): Promise<ActionResult<{ sheetId: string }>> {
  await requireProfile();
  const parsed = deleteColumnSchema.safeParse({ columnId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid column");
  }

  const supabase = await createClient();
  const { data: column, error: fetchError } = await supabase
    .from("sheet_columns")
    .select("id, key, sheet_id, label")
    .eq("id", columnId)
    .single();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  const { data: rowList, error: rowsError } = await supabase
    .from("rows")
    .select("id, data")
    .eq("sheet_id", column.sheet_id);

  if (rowsError) {
    return actionError(rowsError.message);
  }

  for (const row of rowList ?? []) {
    if (!row.data || typeof row.data !== "object" || Array.isArray(row.data)) {
      continue;
    }

    const data = { ...(row.data as Record<string, Json | undefined>) };
    delete data[column.key];

    const { error } = await supabase.from("rows").update({ data: data as Json }).eq("id", row.id);
    if (error) {
      return actionError(error.message);
    }
  }

  const { error: deleteError } = await supabase.from("sheet_columns").delete().eq("id", columnId);

  if (deleteError) {
    return actionError(deleteError.message);
  }

  const context = await getSheetActivityContext(column.sheet_id);
  if (context) {
    await logActivityEvent({
      entityType: "column",
      entityId: column.id,
      action: "deleted",
      workspaceId: context.workspaceId,
      sheetId: column.sheet_id,
      metadata: { column_label: column.label },
    });
  }

  revalidatePath(`/sheets/${column.sheet_id}`);
  return actionSuccess({ sheetId: column.sheet_id });
}
