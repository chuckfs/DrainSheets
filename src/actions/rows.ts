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
import { createRowSchema, updateRowSchema, deleteRowSchema, reorderRowSchema, bulkDeleteRowsSchema, listRowsWindowSchema, getRowSchema } from "@/lib/validations/row";
import type { Json } from "@/types/database";
import type { Row, RowData } from "@/types/domain";
import { computeRowReorder } from "@/lib/sheets/row-position";

function toRowJson(data: RowData): Json {
  return data as Json;
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

export async function listRows(sheetId: string): Promise<Row[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("rows")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("position", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

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
