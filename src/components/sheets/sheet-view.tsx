import { SheetGrid } from "@/components/sheets/sheet-grid";
import { SheetHeader } from "@/components/layout/sheet-header";
import { ListPageShell } from "@/components/layout/list-page-shell";
import type { Row, Sheet, SheetColumn } from "@/types/domain";

export function SheetView({
  sheet,
  columns,
  rows,
}: {
  sheet: Sheet;
  columns: SheetColumn[];
  rows: Row[];
}) {
  return (
    <ListPageShell
      header={
        <SheetHeader
          eyebrow="Sheet"
          title={sheet.name}
          subtitle={sheet.description ?? `${columns.length} columns · ${rows.length} rows`}
        />
      }
    >
      <SheetGrid sheetId={sheet.id} columns={columns} rows={rows} />
    </ListPageShell>
  );
}
