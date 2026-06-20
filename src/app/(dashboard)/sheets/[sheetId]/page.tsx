import { notFound } from "next/navigation";
import { getSheetAccessContext } from "@/actions/access";
import { listColumns } from "@/actions/columns";
import { countRows, listRowsWindow } from "@/actions/rows";
import { getSheet } from "@/actions/sheets";
import { trackRecentSheetView } from "@/actions/search";
import { getSheetTemplateProvenance } from "@/actions/templates";
import { requireProfile } from "@/lib/auth/guards";
import { ROW_WINDOW_SIZE } from "@/lib/sheets/row-window";
import { SetActiveWorkspace } from "@/components/layout/workspace-rail-context";
import { TrackRecentSheetView } from "@/components/search/track-recent-sheet-view";
import { SheetView } from "@/components/sheets/sheet-view";

export default async function SheetPage({
  params,
  searchParams,
}: {
  params: Promise<{ sheetId: string }>;
  searchParams: Promise<{ row?: string; note?: string }>;
}) {
  const { sheetId } = await params;
  const { row } = await searchParams;
  const profile = await requireProfile();
  const [sheet, access] = await Promise.all([getSheet(sheetId), getSheetAccessContext(sheetId)]);

  if (!sheet || !access.canView) {
    notFound();
  }

  const [columns, initialRows, rowCount, templateProvenance] = await Promise.all([
    listColumns(sheetId),
    listRowsWindow(sheetId, 0, ROW_WINDOW_SIZE),
    countRows(sheetId),
    getSheetTemplateProvenance(sheet),
  ]);

  await trackRecentSheetView(sheetId);

  return (
    <>
      <SetActiveWorkspace workspaceId={sheet.workspace_id} />
      <TrackRecentSheetView
        sheetId={sheet.id}
        sheetName={sheet.name}
        workspaceId={sheet.workspace_id}
        workspaceName={null}
      />
      <SheetView
        sheet={sheet}
        columns={columns}
        rows={initialRows}
        rowCount={rowCount}
        access={access}
        templateProvenance={templateProvenance}
        currentUserId={profile.id}
        initialRowId={row ?? null}
      />
    </>
  );
}
