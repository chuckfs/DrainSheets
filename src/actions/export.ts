"use server";

import { revalidatePath } from "next/cache";
import { listColumns } from "@/actions/columns";
import { listSheetRowsView } from "@/actions/rows";
import { getSheet } from "@/actions/sheets";
import { actionError, actionSuccess, type ActionResult } from "@/lib/action-result";
import { requireProfile } from "@/lib/auth/guards";
import {
  buildCsvBase64,
  buildSheetExportMatrix,
  buildXlsxBase64,
  filterExportColumns,
  filterExportRows,
} from "@/lib/export/build-sheet-export";
import { createClient } from "@/lib/supabase/server";
import type { RowFilterCondition } from "@/lib/sheets/row-view";
import { ROW_VIEW_CAP } from "@/lib/sheets/row-view";
import { exportSheetSchema } from "@/lib/validations/export";

const EXPORT_BATCH_SIZE = 1000;

async function listAllSheetRows(
  sheetId: string,
  filters?: RowFilterCondition[],
): Promise<Awaited<ReturnType<typeof listSheetRowsView>>> {
  if (filters && filters.length > 0) {
    return listSheetRowsView(sheetId, filters, ROW_VIEW_CAP);
  }

  const supabase = await createClient();
  const rows: Awaited<ReturnType<typeof listSheetRowsView>> = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("rows")
      .select("*")
      .eq("sheet_id", sheetId)
      .order("position", { ascending: true })
      .range(offset, offset + EXPORT_BATCH_SIZE - 1);

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);
    if (data.length < EXPORT_BATCH_SIZE) {
      break;
    }

    offset += EXPORT_BATCH_SIZE;
  }

  return rows;
}

export async function exportSheetData(
  sheetId: string,
  format: "csv" | "xlsx",
  options?: { filters?: RowFilterCondition[]; includeHidden?: boolean },
): Promise<
  ActionResult<{ fileName: string; mimeType: string; base64: string }>
> {
  await requireProfile();
  const parsed = exportSheetSchema.safeParse({
    sheetId,
    format,
    filters: options?.filters,
    includeHidden: options?.includeHidden,
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Invalid export request");
  }

  const sheet = await getSheet(parsed.data.sheetId);
  if (!sheet) {
    return actionError("Sheet not found");
  }

  const [columns, rows] = await Promise.all([
    listColumns(parsed.data.sheetId),
    listAllSheetRows(parsed.data.sheetId, parsed.data.filters),
  ]);

  const exportColumns = filterExportColumns(columns, parsed.data.includeHidden ?? false);
  const exportRows = filterExportRows(rows, parsed.data.includeHidden ?? false);
  const matrix = buildSheetExportMatrix(exportColumns, exportRows);
  const safeName = sheet.name.replace(/[^\w\-]+/g, "_").slice(0, 80) || "sheet";

  if (parsed.data.format === "csv") {
    return actionSuccess({
      fileName: `${safeName}.csv`,
      mimeType: "text/csv;charset=utf-8",
      base64: buildCsvBase64(matrix),
    });
  }

  return actionSuccess({
    fileName: `${safeName}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    base64: buildXlsxBase64(matrix),
  });
}
