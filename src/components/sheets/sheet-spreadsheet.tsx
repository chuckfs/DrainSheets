"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getContactsByIds, searchContacts, type ContactPickerItem } from "@/actions/contacts";
import { getRow } from "@/actions/rows";
import type { AccessContext } from "@/lib/access/effective-role";
import type { SheetTemplateProvenance } from "@/actions/templates";
import { ListPageShell } from "@/components/layout/list-page-shell";
import { getLoadedRows } from "@/lib/sheets/row-window";
import type { Json } from "@/types/database";
import type { Row, Sheet, SheetColumn } from "@/types/domain";
import { BulkToolbar } from "./bulk-toolbar";
import {
  CollaborationRail,
  CollaborationRailToggle,
  useCollaborationRail,
} from "./collaboration-rail";
import { RowDetailDrawer } from "./row-detail-drawer";
import { SheetContactContext } from "./sheet-contact-context";
import { SheetGrid } from "./sheet-grid";
import { SheetToolbar } from "./sheet-toolbar";
import { useSheetClipboard } from "./use-sheet-clipboard";
import { useSheetGrid } from "./use-sheet-grid";
import { useSheetKeyboard } from "./use-sheet-keyboard";

function collectContactIds(columns: SheetColumn[], rows: (Row | null)[]): string[] {
  const contactColumns = columns.filter((column) => column.type === "contact").map((column) => column.key);
  if (contactColumns.length === 0) {
    return [];
  }

  const ids = new Set<string>();
  for (const row of getLoadedRows(rows)) {
    if (!row.data || typeof row.data !== "object" || Array.isArray(row.data)) {
      continue;
    }

    for (const key of contactColumns) {
      const value = (row.data as Record<string, Json | undefined>)[key];
      if (typeof value === "string" && value.length > 0) {
        ids.add(value);
      }
    }
  }

  return [...ids];
}

export function SheetSpreadsheet({
  sheet,
  initialColumns,
  initialRows,
  initialRowCount,
  access,
  templateProvenance,
  currentUserId,
  initialRowId = null,
}: {
  sheet: Sheet;
  initialColumns: SheetColumn[];
  initialRows: Row[];
  initialRowCount: number;
  access: AccessContext;
  templateProvenance: SheetTemplateProvenance;
  currentUserId: string;
  initialRowId?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { mobileOpen, setMobileOpen } = useCollaborationRail();
  const [rowDrawerOpen, setRowDrawerOpen] = useState(Boolean(initialRowId));
  const [drawerRow, setDrawerRow] = useState<Row | null>(null);

  const grid = useSheetGrid({
    sheetId: sheet.id,
    initialColumns,
    initialRows,
    initialRowCount,
    readOnly: !access.canEdit,
  });

  const { handleKeyDown: handleClipboardKeyDown } = useSheetClipboard(grid);
  useSheetKeyboard(grid, handleClipboardKeyDown);

  useEffect(() => {
    setRowDrawerOpen(Boolean(initialRowId));
  }, [initialRowId]);

  useEffect(() => {
    if (!initialRowId) {
      setDrawerRow(null);
      return;
    }

    const cachedIndex = grid.rows.findIndex((row) => row?.id === initialRowId);
    const cachedRow = cachedIndex >= 0 ? grid.getRowAt(cachedIndex) : null;
    if (cachedRow) {
      setDrawerRow(cachedRow);
      return;
    }

    let cancelled = false;
    void getRow(initialRowId)
      .then((row) => {
        if (!cancelled) {
          setDrawerRow(row);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDrawerRow(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [grid.getRowAt, grid.rows, initialRowId]);

  const [contactsById, setContactsById] = useState<Map<string, ContactPickerItem>>(new Map());

  const contactIds = useMemo(
    () => collectContactIds(grid.columns, grid.rows),
    [grid.columns, grid.rows],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadContacts() {
      if (contactIds.length === 0) {
        setContactsById(new Map());
        return;
      }

      try {
        const contacts = await getContactsByIds(contactIds);
        if (!cancelled) {
          setContactsById(new Map(contacts.map((contact) => [contact.id, contact])));
        }
      } catch {
        if (!cancelled) {
          setContactsById(new Map());
        }
      }
    }

    void loadContacts();
    return () => {
      cancelled = true;
    };
  }, [contactIds]);

  const contactContextValue = useMemo(
    () => ({
      contactsById,
      searchContacts,
    }),
    [contactsById],
  );

  function openRow(rowId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("row", rowId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setRowDrawerOpen(true);
  }

  function closeRowDrawer(open: boolean) {
    if (open) {
      setRowDrawerOpen(true);
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("row");
    params.delete("note");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    setRowDrawerOpen(false);
  }

  return (
    <SheetContactContext.Provider value={contactContextValue}>
      <ListPageShell
        header={
          <>
            <SheetToolbar
              sheet={sheet}
              grid={grid}
              access={access}
              templateProvenance={templateProvenance}
              collaborationToggle={<CollaborationRailToggle onOpen={() => setMobileOpen(true)} />}
            />
            <BulkToolbar grid={grid} />
          </>
        }
      >
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-auto">
            <SheetGrid grid={grid} onOpenRow={openRow} />
          </div>
          <CollaborationRail
            sheetId={sheet.id}
            access={access}
            currentUserId={currentUserId}
            mobileOpen={mobileOpen}
            onMobileOpenChange={setMobileOpen}
          />
        </div>
      </ListPageShell>

      <RowDetailDrawer
        open={rowDrawerOpen && Boolean(drawerRow)}
        onOpenChange={closeRowDrawer}
        sheetId={sheet.id}
        row={drawerRow}
        columns={grid.columns}
        access={access}
        currentUserId={currentUserId}
      />
    </SheetContactContext.Provider>
  );
}
