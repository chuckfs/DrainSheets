"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createRowSchema, updateRowSchema } from "@/lib/validations/row";
import type { Json } from "@/types/database";
import type { Row, RowData } from "@/types/domain";

function toRowJson(data: RowData): Json {
  return data as Json;
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

  revalidatePath(`/sheets/${row.sheet_id}`);
  return actionSuccess(row);
}
