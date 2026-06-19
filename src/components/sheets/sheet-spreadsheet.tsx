"use client";

import { useEffect, useMemo, useState } from "react";
import { getContactsByIds, searchContacts, type ContactPickerItem } from "@/actions/contacts";
import type { AccessContext } from "@/lib/access/effective-role";
import type { SheetTemplateProvenance } from "@/actions/templates";
import { ListPageShell } from "@/components/layout/list-page-shell";
import type { Json } from "@/types/database";
import type { Row, Sheet, SheetColumn } from "@/types/domain";
import { BulkToolbar } from "./bulk-toolbar";
import { SheetContactContext } from "./sheet-contact-context";
import { SheetGrid } from "./sheet-grid";
import { SheetToolbar } from "./sheet-toolbar";
import { useSheetGrid } from "./use-sheet-grid";

function collectContactIds(columns: SheetColumn[], rows: Row[]): string[] {
  const contactColumns = columns.filter((column) => column.type === "contact").map((column) => column.key);
  if (contactColumns.length === 0) {
    return [];
  }

  const ids = new Set<string>();
  for (const row of rows) {
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
  access,
  templateProvenance,
}: {
  sheet: Sheet;
  initialColumns: SheetColumn[];
  initialRows: Row[];
  access: AccessContext;
  templateProvenance: SheetTemplateProvenance;
}) {
  const grid = useSheetGrid({
    sheetId: sheet.id,
    initialColumns,
    initialRows,
    readOnly: !access.canEdit,
  });

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
            />
            <BulkToolbar grid={grid} />
          </>
        }
      >
        <SheetGrid grid={grid} />
      </ListPageShell>
    </SheetContactContext.Provider>
  );
}
