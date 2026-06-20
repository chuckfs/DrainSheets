"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { getSheetActivityContext, logActivityEvent } from "@/lib/activity/log-event";
import {
  firstUpdatedColumnLabel,
  getColumnLabelByKey,
  getPrimaryRowTitle,
} from "@/lib/activity/row-metadata";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { batchUpdateRowStylesSchema } from "@/lib/validations/cell-style";
import {
  bulkDeleteRowsSchema,
  createRowSchema,
  deleteRowSchema,
  getRowSchema,
  listRowsWindowSchema,
  reorderRowSchema,
  unhideAllRowsSchema,
  updateRowHeightSchema,
  updateRowHiddenSchema,
  updateRowSchema,
} from "@/lib/validations/row";
import type { Json } from "@/types/database";
import type { Row, RowData } from "@/types/domain";
import { computeRowReorder } from "@/lib/sheets/row-position";
import { ROW_VIEW_CAP, type RowFilterCondition } from "@/lib/sheets/row-view";

function toRowJson(data: RowData): Json {
  return data as Json;
}

async function getColumnKeySet(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sheetId: string,
): Promise<Set<string>> {
  const { data } = await supabase.from("sheet_columns").select("key").eq("sheet_id", sheetId);
  return new Set((data ?? []).map((column) => column.key as string));
}

function rowJsonPath(columnKey: string): string {
  return `data->>${columnKey}`;
}

export async function countRows(sheetId: string): Promise<number> {
  await requireProfile();
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("rows")
    .select("*", { count: "exact", head: true })
    .eq("sheet_id", sheetId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

/**
 * Rows matching a set of filters, ordered by position, capped at ROW_VIEW_CAP.
 * Filter column keys are validated against the sheet's real columns. Values are
 * parameterized by the query builder. Sorting is applied client-side (type-aware).
 */
export async function listSheetRowsView(
  sheetId: string,
  filters: RowFilterCondition[],
  limit: number = ROW_VIEW_CAP,
): Promise<Row[]> {
  await requireProfile();
  const supabase = await createClient();
  const validKeys = await getColumnKeySet(supabase, sheetId);

  let query = supabase
    .from("rows")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: true })
    .limit(Math.min(Math.max(limit, 1), ROW_VIEW_CAP));

  for (const filter of filters) {
    if (!validKeys.has(filter.columnKey)) {
      continue;
    }
    const column = rowJsonPath(filter.columnKey);
    switch (filter.operator) {
      case "contains":
        query = query.ilike(column, `%${filter.value}%`);
        break;
      case "equals":
        query = query.eq(column, filter.value);
        break;
      case "not_equals":
        query = query.neq(column, filter.value);
        break;
      case "is_empty":
        query = query.is(column, null);
        break;
      case "is_not_empty":
        query = query.not(column, "is", null);
        break;
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

/** Total number of rows matching the filters (uncapped), for "showing X of Y". */
export async function countSheetRowsView(
  sheetId: string,
  filters: RowFilterCondition[],
): Promise<number> {
  await requireProfile();
  const supabase = await createClient();
  const validKeys = await getColumnKeySet(supabase, sheetId);

  let query = supabase
    .from("rows")
    .select("id", { count: "exact", head: true })
    .eq("sheet_id", sheetId);

  for (const filter of filters) {
    if (!validKeys.has(filter.columnKey)) {
      continue;
    }
    const column = rowJsonPath(filter.columnKey);
    switch (filter.operator) {
      case "contains":
        query = query.ilike(column, `%${filter.value}%`);
        break;
      case "equals":
        query = query.eq(column, filter.value);
        break;
      case "not_equals":
        query = query.neq(column, filter.value);
        break;
      case "is_empty":
        query = query.is(column, null);
        break;
      case "is_not_empty":
        query = query.not(column, "is", null);
        break;
    }
  }

  const { count, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return count ?? 0;
}

export async function listRowsWindow(
  sheetId: string,
  offset: number,
  limit: number,
): Promise<Row[]> {
  await requireProfile();
  const parsed = listRowsWindowSchema.safeParse({ sheetId, offset, limit });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid row window");
  }

  const supabase = await createClient();
  const rangeEnd = parsed.data.offset + parsed.data.limit - 1;

  const { data, error } = await supabase
    .from("rows")
    .select("*")
    .eq("sheet_id", parsed.data.sheetId)
    .order("position", { ascending: true })
    .range(parsed.data.offset, rangeEnd);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getRow(rowId: string): Promise<Row | null> {
  await requireProfile();
  const parsed = getRowSchema.safeParse({ rowId });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid row");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rows")
    .select("*")
    .eq("id", parsed.data.rowId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// NOTE: there is intentionally no "load every row" action. The grid loads rows
// in windows (listRowsWindow) so large sheets never fetch the whole dataset.
// Filtered/sorted views use listSheetRowsView, which is capped at ROW_VIEW_CAP.

async function nextRowPosition(sheetId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rows")
    .select("position")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data?.position ?? -1) + 1;
}

export async function createRow(
  sheetId: string,
  data: RowData = {},
): Promise<ActionResult<Row>> {
  const profile = await requireProfile();
  const parsed = createRowSchema.safeParse({ sheetId, data });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid row");
  }

  const supabase = await createClient();
  const position = await nextRowPosition(sheetId);

  const { data: row, error } = await supabase
    .from("rows")
    .insert({
      sheet_id: sheetId,
      org_id: profile.org_id,
      position,
      data: toRowJson(parsed.data.data as RowData),
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(sheetId);
  if (context) {
    await logActivityEvent({
      entityType: "row",
      entityId: row.id,
      action: "created",
      workspaceId: context.workspaceId,
      sheetId,
      rowId: row.id,
      metadata: {
        row_title: await getPrimaryRowTitle(sheetId, parsed.data.data as RowData),
      },
    });
  }

  revalidatePath(`/sheets/${sheetId}`);
  return actionSuccess(row);
}

export async function updateRow(
  rowId: string,
  data: RowData,
): Promise<ActionResult<Row>> {
  await requireProfile();
  const parsed = updateRowSchema.safeParse({ rowId, data });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid row");
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("rows")
    .select("data")
    .eq("id", rowId)
    .single();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  const currentData =
    existing.data && typeof existing.data === "object" && !Array.isArray(existing.data)
      ? (existing.data as Record<string, Json | undefined>)
      : {};

  const mergedData = { ...currentData, ...parsed.data.data };

  const { data: row, error } = await supabase
    .from("rows")
    .update({ data: toRowJson(mergedData as RowData) })
    .eq("id", rowId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  const changedKey = firstUpdatedColumnLabel(currentData, mergedData as Record<string, Json | undefined>);
  const context = await getSheetActivityContext(row.sheet_id);
  if (context && changedKey) {
    await logActivityEvent({
      entityType: "row",
      entityId: row.id,
      action: "updated",
      workspaceId: context.workspaceId,
      sheetId: row.sheet_id,
      rowId: row.id,
      metadata: {
        column_label: (await getColumnLabelByKey(row.sheet_id, changedKey)) ?? changedKey,
        row_title: await getPrimaryRowTitle(row.sheet_id, mergedData as RowData),
      },
    });
  }

  revalidatePath(`/sheets/${row.sheet_id}`);
  return actionSuccess(row);
}

export async function deleteRow(rowId: string): Promise<ActionResult<{ sheetId: string }>> {
  await requireProfile();
  const parsed = deleteRowSchema.safeParse({ rowId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid row");
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("rows")
    .select("sheet_id, data")
    .eq("id", rowId)
    .single();

  if (fetchError) {
    return actionError(fetchError.message);
  }

  const { error } = await supabase.from("rows").delete().eq("id", rowId);

  if (error) {
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(existing.sheet_id);
  if (context) {
    const rowData =
      existing.data && typeof existing.data === "object" && !Array.isArray(existing.data)
        ? (existing.data as RowData)
        : {};
    await logActivityEvent({
      entityType: "row",
      entityId: rowId,
      action: "deleted",
      workspaceId: context.workspaceId,
      sheetId: existing.sheet_id,
      rowId,
      metadata: {
        row_title: await getPrimaryRowTitle(existing.sheet_id, rowData),
      },
    });
  }

  revalidatePath(`/sheets/${existing.sheet_id}`);
  return actionSuccess({ sheetId: existing.sheet_id });
}

export async function duplicateRow(rowId: string): Promise<ActionResult<Row>> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: source, error: sourceError } = await supabase
    .from("rows")
    .select("*")
    .eq("id", rowId)
    .single();

  if (sourceError) {
    return actionError(sourceError.message);
  }

  const targetPosition = source.position + 1;

  const { data: siblings, error: siblingsError } = await supabase
    .from("rows")
    .select("id, position")
    .eq("sheet_id", source.sheet_id)
    .gte("position", targetPosition)
    .order("position", { ascending: true });

  if (siblingsError) {
    return actionError(siblingsError.message);
  }

  for (const sibling of siblings ?? []) {
    const { error } = await supabase
      .from("rows")
      .update({ position: sibling.position + 1 })
      .eq("id", sibling.id);

    if (error) {
      return actionError(error.message);
    }
  }

  const { data: row, error } = await supabase
    .from("rows")
    .insert({
      sheet_id: source.sheet_id,
      org_id: profile.org_id,
      position: targetPosition,
      data: source.data,
      height: source.height,
      styles: source.styles,
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${source.sheet_id}`);
  return actionSuccess(row);
}

export async function reorderRow(
  rowId: string,
  targetPosition: number,
): Promise<ActionResult<Row[]>> {
  await requireProfile();
  const parsed = reorderRowSchema.safeParse({ rowId, targetPosition });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid reorder");
  }

  const supabase = await createClient();
  const { data: current, error: currentError } = await supabase
    .from("rows")
    .select("*")
    .eq("id", rowId)
    .single();

  if (currentError) {
    return actionError(currentError.message);
  }

  const { data: siblings, error: siblingsError } = await supabase
    .from("rows")
    .select("*")
    .eq("sheet_id", current.sheet_id)
    .order("position", { ascending: true });

  if (siblingsError || !siblings) {
    return actionError(siblingsError?.message ?? "Failed to load rows");
  }

  let reordered: Row[];
  try {
    reordered = computeRowReorder(siblings, rowId, parsed.data.targetPosition);
  } catch {
    return actionError("Row not found");
  }

  for (const row of reordered) {
    const sibling = siblings.find((entry) => entry.id === row.id);
    if (!sibling || sibling.position === row.position) {
      continue;
    }

    const { error } = await supabase.from("rows").update({ position: row.position }).eq("id", row.id);
    if (error) {
      return actionError(error.message);
    }
  }

  revalidatePath(`/sheets/${current.sheet_id}`);
  return actionSuccess(reordered);
}

export async function bulkDeleteRows(rowIds: string[]): Promise<ActionResult<{ sheetId: string }>> {
  await requireProfile();
  const parsed = bulkDeleteRowsSchema.safeParse({ rowIds });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid row selection");
  }

  const supabase = await createClient();
  const { data: rows, error: fetchError } = await supabase
    .from("rows")
    .select("sheet_id")
    .in("id", parsed.data.rowIds)
    .limit(1);

  if (fetchError || !rows?.[0]) {
    return actionError(fetchError?.message ?? "Rows not found");
  }

  const sheetId = rows[0].sheet_id;
  const { error } = await supabase.from("rows").delete().in("id", parsed.data.rowIds);

  if (error) {
    return actionError(error.message);
  }

  const context = await getSheetActivityContext(sheetId);
  if (context) {
    for (const deletedId of parsed.data.rowIds) {
      await logActivityEvent({
        entityType: "row",
        entityId: deletedId,
        action: "deleted",
        workspaceId: context.workspaceId,
        sheetId,
        rowId: deletedId,
      });
    }
  }

  revalidatePath(`/sheets/${sheetId}`);
  return actionSuccess({ sheetId });
}

export async function batchUpdateRows(
  updates: Array<{ rowId: string; data: RowData }>,
  options?: { operation?: string; sheetId?: string },
): Promise<ActionResult<{ updated: number }>> {
  await requireProfile();

  if (updates.length === 0) {
    return actionSuccess({ updated: 0 });
  }

  const supabase = await createClient();
  let sheetId = options?.sheetId ?? null;
  let updated = 0;

  for (const entry of updates) {
    const { data: existing, error: fetchError } = await supabase
      .from("rows")
      .select("sheet_id, data")
      .eq("id", entry.rowId)
      .single();

    if (fetchError) {
      return actionError(fetchError.message);
    }

    sheetId = sheetId ?? existing.sheet_id;
    const currentData =
      existing.data && typeof existing.data === "object" && !Array.isArray(existing.data)
        ? (existing.data as Record<string, Json | undefined>)
        : {};

    const merged = { ...currentData, ...entry.data };
    const { error } = await supabase
      .from("rows")
      .update({ data: toRowJson(merged as RowData) })
      .eq("id", entry.rowId);

    if (error) {
      return actionError(error.message);
    }

    updated += 1;
  }

  if (sheetId) {
    const context = await getSheetActivityContext(sheetId);
    if (context) {
      await logActivityEvent({
        entityType: "row",
        entityId: updates[0]!.rowId,
        action: "updated",
        workspaceId: context.workspaceId,
        sheetId,
        metadata: {
          operation: options?.operation ?? "batch_update",
          cell_count: String(updated),
        },
      });
    }

    revalidatePath(`/sheets/${sheetId}`);
  }

  return actionSuccess({ updated });
}

export async function updateRowHidden(
  rowId: string,
  isHidden: boolean,
): Promise<ActionResult<Row>> {
  await requireProfile();
  const parsed = updateRowHiddenSchema.safeParse({ rowId, isHidden });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid row");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rows")
    .update({ is_hidden: parsed.data.isHidden })
    .eq("id", parsed.data.rowId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${data.sheet_id}`);
  return actionSuccess(data);
}

export async function unhideAllRows(sheetId: string): Promise<ActionResult<{ updated: number }>> {
  await requireProfile();
  const parsed = unhideAllRowsSchema.safeParse({ sheetId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid sheet");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rows")
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

export async function updateRowHeight(
  rowId: string,
  height: number | null,
): Promise<ActionResult<Row>> {
  await requireProfile();
  const parsed = updateRowHeightSchema.safeParse({ rowId, height });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid row height");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rows")
    .update({ height: parsed.data.height })
    .eq("id", parsed.data.rowId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${data.sheet_id}`);
  return actionSuccess(data);
}

export async function batchUpdateRowStyles(
  updates: Array<{ rowId: string; styles: Record<string, Json> }>,
  options?: { sheetId?: string },
): Promise<ActionResult<{ updated: number }>> {
  await requireProfile();
  const parsed = batchUpdateRowStylesSchema.safeParse({ updates });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid row styles");
  }

  const supabase = await createClient();
  let updated = 0;
  let sheetId = options?.sheetId;

  for (const entry of parsed.data.updates) {
    const { data: existing, error: fetchError } = await supabase
      .from("rows")
      .select("sheet_id")
      .eq("id", entry.rowId)
      .single();

    if (fetchError) {
      return actionError(fetchError.message);
    }

    sheetId = sheetId ?? existing.sheet_id;

    const { error } = await supabase
      .from("rows")
      .update({ styles: entry.styles as Json })
      .eq("id", entry.rowId);

    if (error) {
      return actionError(error.message);
    }

    updated += 1;
  }

  if (sheetId) {
    revalidatePath(`/sheets/${sheetId}`);
  }

  return actionSuccess({ updated });
}
