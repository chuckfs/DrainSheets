import type { AccessContext } from "@/lib/access/effective-role";
import type { SheetTemplateProvenance } from "@/actions/templates";
import { SheetSpreadsheet } from "@/components/sheets/sheet-spreadsheet";
import type { Row, Sheet, SheetColumn } from "@/types/domain";

export function SheetView({
  sheet,
  columns,
  rows,
  access,
  templateProvenance,
}: {
  sheet: Sheet;
  columns: SheetColumn[];
  rows: Row[];
  access: AccessContext;
  templateProvenance: SheetTemplateProvenance;
}) {
  return (
    <SheetSpreadsheet
      sheet={sheet}
      initialColumns={columns}
      initialRows={rows}
      access={access}
      templateProvenance={templateProvenance}
    />
  );
}
