"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { uniqueColumnKey } from "@/lib/sheets/column-key";
import { createClient } from "@/lib/supabase/server";
import {
  createColumnSchema,
  moveColumnSchema,
  updateColumnConfigSchema,
  updateColumnLabelSchema,
  updateColumnWidthSchema,
} from "@/lib/validations/column";
import type { ColumnType, SheetColumn } from "@/types/domain";
import { getDefaultColumnWidth } from "@/lib/sheets/column-widths";
import { selectOptionsToConfig, type SelectOptionConfig } from "@/lib/sheets/select-options";
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
  const { data: column, error } = await supabase
    .from("sheet_columns")
    .update({ label: parsed.data.label })
    .eq("id", columnId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
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
