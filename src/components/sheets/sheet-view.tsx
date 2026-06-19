import type { AccessContext } from "@/lib/access/effective-role";
import { SheetSpreadsheet } from "@/components/sheets/sheet-spreadsheet";
import type { Row, Sheet, SheetColumn } from "@/types/domain";

export function SheetView({
  sheet,
  columns,
  rows,
  access,
}: {
  sheet: Sheet;
  columns: SheetColumn[];
  rows: Row[];
  access: AccessContext;
}) {
  return (
    <SheetSpreadsheet
      sheet={sheet}
      initialColumns={columns}
      initialRows={rows}
      access={access}
    />
  );
}
