import { notFound } from "next/navigation";
import { getSheetAccessContext } from "@/actions/access";
import { listColumns } from "@/actions/columns";
import { listRowsWindow } from "@/actions/rows";
import { getSheet } from "@/actions/sheets";
import { requireProfile } from "@/lib/auth/guards";
import {
  buildSheetExportMatrix,
  filterExportColumns,
  filterExportRows,
} from "@/lib/export/build-sheet-export";
import { ROW_WINDOW_SIZE } from "@/lib/sheets/row-window";
import { SheetPrintTable } from "@/components/sheets/sheet-print-table";

export default async function SheetPrintPage({
  params,
}: {
  params: Promise<{ sheetId: string }>;
}) {
  await requireProfile();
  const { sheetId } = await params;
  const [sheet, access, columns, rows] = await Promise.all([
    getSheet(sheetId),
    getSheetAccessContext(sheetId),
    listColumns(sheetId),
    listRowsWindow(sheetId, 0, ROW_WINDOW_SIZE),
  ]);

  if (!sheet || !access.canView) {
    notFound();
  }

  const exportColumns = filterExportColumns(columns, false);
  const exportRows = filterExportRows(rows, false);
  const matrix = buildSheetExportMatrix(exportColumns, exportRows);

  return (
    <div className="min-h-screen bg-white p-8 print:p-4">
      <div className="mb-6 print:hidden">
        <h1 className="text-lg font-semibold">{sheet.name}</h1>
        <p className="text-sm text-muted-foreground">Print preview — first {rows.length} rows shown.</p>
      </div>
      <SheetPrintTable matrix={matrix} sheetName={sheet.name} autoPrint />
    </div>
  );
}
