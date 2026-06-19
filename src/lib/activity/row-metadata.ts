import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import type { RowData } from "@/types/domain";

export async function getPrimaryRowTitle(sheetId: string, data: RowData): Promise<string | null> {
  const supabase = await createClient();
  const { data: primaryColumn } = await supabase
    .from("sheet_columns")
    .select("key")
    .eq("sheet_id", sheetId)
    .eq("is_primary", true)
    .maybeSingle();

  if (!primaryColumn?.key) {
    return null;
  }

  const value = data[primaryColumn.key];
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

export async function getColumnLabel(columnId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("sheet_columns").select("label").eq("id", columnId).maybeSingle();
  return data?.label ?? null;
}

export async function getColumnLabelByKey(sheetId: string, key: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sheet_columns")
    .select("label")
    .eq("sheet_id", sheetId)
    .eq("key", key)
    .maybeSingle();

  return data?.label ?? null;
}

export function firstUpdatedColumnLabel(
  previous: Record<string, Json | undefined>,
  next: Record<string, Json | undefined>,
): string | null {
  for (const key of Object.keys(next)) {
    if (JSON.stringify(previous[key]) !== JSON.stringify(next[key])) {
      return key;
    }
  }

  return null;
}
