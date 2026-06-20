"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getContactsByIds, searchContacts, type ContactPickerItem } from "@/actions/contacts";
import { countSheetRowsView, getRow, listSheetRowsView } from "@/actions/rows";
import type { AccessContext } from "@/lib/access/effective-role";
import {
  isRowViewActive,
  sortRows,
  type RowFilterCondition,
  type RowSort,
} from "@/lib/sheets/row-view";
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
import { SheetClipboardProvider } from "./sheet-clipboard-context";
import { SheetContactContext } from "./sheet-contact-context";
import { SheetGrid } from "./sheet-grid";
import { SheetRibbonToolbar } from "./sheet-ribbon-toolbar";
import { SheetToolbar } from "./sheet-toolbar";
import { SheetViewControls } from "./sheet-view-controls";
import type { SheetViewState } from "./sheet-view-picker";
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

  // Sort + filter ("view"). Filtering happens server-side; sorting is applied
  // client-side here so it is type-aware. The hook is fed an effective row set
  // and never needs to know a view is active.
  const [sort, setSort] = useState<RowSort | null>(null);
  const [filters, setFilters] = useState<RowFilterCondition[]>([]);
  const [viewRows, setViewRows] = useState<Row[] | null>(null);
  const [viewTotal, setViewTotal] = useState(0);
  const [viewLoading, setViewLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const viewActive = isRowViewActive(sort, filters);

  useEffect(() => {
    if (!viewActive) {
      setViewRows(null);
      setViewTotal(0);
      return;
    }
    let cancelled = false;
    setViewLoading(true);
    Promise.all([listSheetRowsView(sheet.id, filters), countSheetRowsView(sheet.id, filters)])
      .then(([rows, total]) => {
        if (cancelled) return;
        setViewRows(rows);
        setViewTotal(total);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        toast.error(error instanceof Error ? error.message : "Failed to apply view");
        setViewRows([]);
        setViewTotal(0);
      })
      .finally(() => {
        if (!cancelled) setViewLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `sort` is intentionally excluded: it re-sorts the fetched set client-side
    // (below) without needing to re-query.
  }, [viewActive, sheet.id, filters]);

  const sortedViewRows = useMemo(() => {
    if (viewRows === null) return null;
    return sort ? sortRows(viewRows, sort, initialColumns) : viewRows;
  }, [viewRows, sort, initialColumns]);

  const effectiveRows = sortedViewRows ?? initialRows;
  const effectiveRowCount = sortedViewRows ? sortedViewRows.length : initialRowCount;

  const grid = useSheetGrid({
    sheetId: sheet.id,
    initialColumns,
    initialRows: effectiveRows,
    initialRowCount: effectiveRowCount,
    readOnly: !access.canEdit,
  });

  const clipboard = useSheetClipboard(grid);
  useSheetKeyboard(grid, clipboard.handleKeyDown);

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

  const viewState = useMemo<SheetViewState>(
    () => ({
      sort,
      filters,
      hiddenColumnKeys: grid.columns.filter((column) => column.is_hidden).map((column) => column.key),
      hiddenRowIds: grid.rows
        .filter((row): row is Row => row !== null && row.is_hidden)
        .map((row) => row.id),
    }),
    [filters, grid.columns, grid.rows, sort],
  );

  const applyViewState = useCallback(
    async (state: SheetViewState) => {
      setSort(state.sort);
      setFilters(state.filters);

      const columnIdsToHide = state.hiddenColumnKeys
        .map((key) => grid.columns.find((column) => column.key === key)?.id)
        .filter((columnId): columnId is string => Boolean(columnId));

      await grid.unhideAllColumns();
      for (const columnId of columnIdsToHide) {
        await grid.hideColumnById(columnId);
      }

      await grid.unhideAllRows();
      for (const rowId of state.hiddenRowIds) {
        await grid.hideRowById(rowId);
      }
    },
    [grid],
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
      <SheetClipboardProvider clipboard={clipboard}>
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
            <SheetRibbonToolbar
              grid={grid}
              clipboard={clipboard}
              sheetId={sheet.id}
              viewState={viewState}
              onApplyViewState={(state) => void applyViewState(state)}
              filterActive={filters.length > 0 || filterOpen}
              onToggleFilter={() => setFilterOpen((open) => !open)}
            />
            <SheetViewControls
              columns={grid.columns}
              sort={sort}
              filters={filters}
              onSortChange={setSort}
              onFiltersChange={setFilters}
              shown={effectiveRowCount}
              total={viewActive ? viewTotal : initialRowCount}
              capped={viewActive && viewTotal > effectiveRowCount}
              loading={viewLoading}
              filterOpen={filterOpen}
              onFilterOpenChange={setFilterOpen}
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
      </SheetClipboardProvider>
    </SheetContactContext.Provider>
  );
}
