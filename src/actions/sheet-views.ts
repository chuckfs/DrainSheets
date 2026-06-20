"use server";

import { revalidatePath } from "next/cache";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import type { RowSort } from "@/lib/sheets/row-view";
import { createClient } from "@/lib/supabase/server";
import {
  createSheetViewSchema,
  deleteSheetViewSchema,
  updateSheetViewSchema,
} from "@/lib/validations/sheet-view";
import type { Json } from "@/types/database";
import type { SheetView } from "@/types/domain";

function sortToJson(sort: RowSort | null | undefined): Json | null {
  if (!sort) {
    return null;
  }

  return sort as Json;
}

export async function listSheetViews(sheetId: string): Promise<SheetView[]> {
  await requireProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("sheet_views")
    .select("*")
    .eq("sheet_id", sheetId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function createSheetView(input: {
  sheetId: string;
  name: string;
  sort?: RowSort | null;
  filters?: SheetView["filters"];
  hiddenColumnKeys?: string[];
  hiddenRowIds?: string[];
}): Promise<ActionResult<SheetView>> {
  const profile = await requireProfile();
  const parsed = createSheetViewSchema.safeParse({
    sheetId: input.sheetId,
    name: input.name.trim(),
    sort: input.sort ?? null,
    filters: input.filters ?? [],
    hiddenColumnKeys: input.hiddenColumnKeys ?? [],
    hiddenRowIds: input.hiddenRowIds ?? [],
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid view");
  }

  const supabase = await createClient();
  const { data: sheet, error: sheetError } = await supabase
    .from("sheets")
    .select("org_id")
    .eq("id", parsed.data.sheetId)
    .single();

  if (sheetError) {
    return actionError(sheetError.message);
  }

  const { data, error } = await supabase
    .from("sheet_views")
    .insert({
      sheet_id: parsed.data.sheetId,
      org_id: sheet.org_id,
      name: parsed.data.name,
      sort: sortToJson(parsed.data.sort ?? null),
      filters: parsed.data.filters as Json,
      hidden_column_keys: parsed.data.hiddenColumnKeys,
      hidden_row_ids: parsed.data.hiddenRowIds,
      created_by: profile.id,
    })
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${parsed.data.sheetId}`);
  return actionSuccess(data);
}

export async function updateSheetView(input: {
  viewId: string;
  name?: string;
  sort?: RowSort | null;
  filters?: SheetView["filters"];
  hiddenColumnKeys?: string[];
  hiddenRowIds?: string[];
}): Promise<ActionResult<SheetView>> {
  await requireProfile();
  const parsed = updateSheetViewSchema.safeParse({
    viewId: input.viewId,
    name: input.name?.trim(),
    sort: input.sort,
    filters: input.filters,
    hiddenColumnKeys: input.hiddenColumnKeys,
    hiddenRowIds: input.hiddenRowIds,
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid view");
  }

  const supabase = await createClient();
  const patch: {
    name?: string;
    sort?: Json | null;
    filters?: Json;
    hidden_column_keys?: string[];
    hidden_row_ids?: string[];
  } = {};

  if (parsed.data.name !== undefined) {
    patch.name = parsed.data.name;
  }
  if (parsed.data.sort !== undefined) {
    patch.sort = sortToJson(parsed.data.sort);
  }
  if (parsed.data.filters !== undefined) {
    patch.filters = parsed.data.filters as Json;
  }
  if (parsed.data.hiddenColumnKeys !== undefined) {
    patch.hidden_column_keys = parsed.data.hiddenColumnKeys;
  }
  if (parsed.data.hiddenRowIds !== undefined) {
    patch.hidden_row_ids = parsed.data.hiddenRowIds;
  }

  const { data, error } = await supabase
    .from("sheet_views")
    .update(patch)
    .eq("id", parsed.data.viewId)
    .select("*")
    .single();

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${data.sheet_id}`);
  return actionSuccess(data);
}

export async function deleteSheetView(viewId: string): Promise<ActionResult<{ sheetId: string }>> {
  await requireProfile();
  const parsed = deleteSheetViewSchema.safeParse({ viewId });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid view");
  }

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("sheet_views")
    .select("sheet_id")
    .eq("id", parsed.data.viewId)
    .single();

  if (existingError) {
    return actionError(existingError.message);
  }

  const { error } = await supabase.from("sheet_views").delete().eq("id", parsed.data.viewId);

  if (error) {
    return actionError(error.message);
  }

  revalidatePath(`/sheets/${existing.sheet_id}`);
  return actionSuccess({ sheetId: existing.sheet_id });
}
