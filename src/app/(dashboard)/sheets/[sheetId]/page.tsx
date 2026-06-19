import { notFound } from "next/navigation";
import { getSheetAccessContext } from "@/actions/access";
import { listColumns } from "@/actions/columns";
import { listRows } from "@/actions/rows";
import { getSheet } from "@/actions/sheets";
import { trackRecentSheetView } from "@/actions/search";
import { getSheetTemplateProvenance } from "@/actions/templates";
import { TrackRecentSheetView } from "@/components/search/track-recent-sheet-view";
import { SheetView } from "@/components/sheets/sheet-view";

export default async function SheetPage({ params }: { params: Promise<{ sheetId: string }> }) {
  const { sheetId } = await params;
  const [sheet, access] = await Promise.all([getSheet(sheetId), getSheetAccessContext(sheetId)]);

  if (!sheet || !access.canView) {
    notFound();
  }

  const [columns, rows, templateProvenance] = await Promise.all([
    listColumns(sheetId),
    listRows(sheetId),
    getSheetTemplateProvenance(sheet),
  ]);

  await trackRecentSheetView(sheetId);

  return (
    <>
      <TrackRecentSheetView
        sheetId={sheet.id}
        sheetName={sheet.name}
        workspaceId={sheet.workspace_id}
        workspaceName={null}
      />
      <SheetView
      sheet={sheet}
      columns={columns}
      rows={rows}
      access={access}
      templateProvenance={templateProvenance}
    />
    </>
  );
}
