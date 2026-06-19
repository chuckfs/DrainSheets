import type { AccessContext } from "@/lib/access/effective-role";
import type { SheetTemplateProvenance } from "@/actions/templates";
import { SheetErrorBoundary } from "@/components/errors/error-boundaries";
import { SheetSpreadsheet } from "@/components/sheets/sheet-spreadsheet";
import type { Row, Sheet, SheetColumn } from "@/types/domain";

export function SheetView({
  sheet,
  columns,
  rows,
  rowCount,
  access,
  templateProvenance,
  currentUserId,
  initialRowId = null,
}: {
  sheet: Sheet;
  columns: SheetColumn[];
  rows: Row[];
  rowCount: number;
  access: AccessContext;
  templateProvenance: SheetTemplateProvenance;
  currentUserId: string;
  initialRowId?: string | null;
}) {
  return (
    <SheetErrorBoundary>
      <SheetSpreadsheet
        sheet={sheet}
        initialColumns={columns}
        initialRows={rows}
        initialRowCount={rowCount}
        access={access}
        templateProvenance={templateProvenance}
        currentUserId={currentUserId}
        initialRowId={initialRowId}
      />
    </SheetErrorBoundary>
  );
}
