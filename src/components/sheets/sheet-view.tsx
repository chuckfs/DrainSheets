import { SheetSpreadsheet } from "@/components/sheets/sheet-spreadsheet";
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
  return <SheetSpreadsheet sheet={sheet} initialColumns={columns} initialRows={rows} />;
}
