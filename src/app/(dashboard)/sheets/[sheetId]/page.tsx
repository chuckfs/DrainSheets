import { notFound } from "next/navigation";
import { listColumns } from "@/actions/columns";
import { listRows } from "@/actions/rows";
import { getSheet } from "@/actions/sheets";
import { SheetView } from "@/components/sheets/sheet-view";

export default async function SheetPage({ params }: { params: Promise<{ sheetId: string }> }) {
  const { sheetId } = await params;
  const sheet = await getSheet(sheetId);

  if (!sheet) {
    notFound();
  }

  const [columns, rows] = await Promise.all([listColumns(sheetId), listRows(sheetId)]);

  return <SheetView sheet={sheet} columns={columns} rows={rows} />;
}
