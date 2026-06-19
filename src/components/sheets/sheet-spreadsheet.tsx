"use client";

import { ListPageShell } from "@/components/layout/list-page-shell";
import type { Row, Sheet, SheetColumn } from "@/types/domain";
import { SheetGrid } from "./sheet-grid";
import { SheetToolbar } from "./sheet-toolbar";
import { useSheetGrid } from "./use-sheet-grid";

export function SheetSpreadsheet({
  sheet,
  initialColumns,
  initialRows,
}: {
  sheet: Sheet;
  initialColumns: SheetColumn[];
  initialRows: Row[];
}) {
  const grid = useSheetGrid({
    sheetId: sheet.id,
    initialColumns,
    initialRows,
  });

  return (
    <ListPageShell header={<SheetToolbar sheet={sheet} grid={grid} />}>
      <SheetGrid grid={grid} />
    </ListPageShell>
  );
}
