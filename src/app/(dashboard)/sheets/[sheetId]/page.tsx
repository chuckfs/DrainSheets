import { notFound } from "next/navigation";
import { getSheetAccessContext } from "@/actions/access";
import { listColumns } from "@/actions/columns";
import { listRows } from "@/actions/rows";
import { getSheet } from "@/actions/sheets";
import { SheetView } from "@/components/sheets/sheet-view";

export default async function SheetPage({ params }: { params: Promise<{ sheetId: string }> }) {
  const { sheetId } = await params;
  const [sheet, access] = await Promise.all([getSheet(sheetId), getSheetAccessContext(sheetId)]);

  if (!sheet || !access.canView) {
    notFound();
  }

  const [columns, rows] = await Promise.all([listColumns(sheetId), listRows(sheetId)]);

  return <SheetView sheet={sheet} columns={columns} rows={rows} access={access} />;
}
