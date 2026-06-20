"use client";

import { useEffect, useState } from "react";
import { ArrowUpDownIcon, FilterIcon, XIcon } from "lucide-react";
import type { SheetColumn } from "@/types/domain";
import {
  ROW_FILTER_OPERATORS,
  type RowFilterCondition,
  type RowFilterOperator,
  type RowSort,
  type RowSortDirection,
} from "@/lib/sheets/row-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const selectClass =
  "h-7 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring";

function operatorNeedsValue(operator: RowFilterOperator): boolean {
  return ROW_FILTER_OPERATORS.find((entry) => entry.value === operator)?.needsValue ?? true;
}

export function SheetViewControls({
  columns,
  sort,
  filters,
  onSortChange,
  onFiltersChange,
  shown,
  total,
  capped,
  loading,
  filterOpen: controlledFilterOpen,
  onFilterOpenChange,
}: {
  columns: SheetColumn[];
  sort: RowSort | null;
  filters: RowFilterCondition[];
  onSortChange: (sort: RowSort | null) => void;
  onFiltersChange: (filters: RowFilterCondition[]) => void;
  shown: number;
  total: number;
  capped: boolean;
  loading: boolean;
  filterOpen?: boolean;
  onFilterOpenChange?: (open: boolean) => void;
}) {
  const [internalFilterOpen, setInternalFilterOpen] = useState(false);
  const filterOpen = controlledFilterOpen ?? internalFilterOpen;
  const setFilterOpen = onFilterOpenChange ?? setInternalFilterOpen;
  const [draft, setDraft] = useState<RowFilterCondition[]>(filters);

  // Keep the draft in sync when applied filters change elsewhere (e.g. cleared).
  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const firstColumnKey = columns[0]?.key ?? "";

  function handleSortColumn(columnKey: string) {
    if (!columnKey) {
      onSortChange(null);
      return;
    }
    onSortChange({ columnKey, direction: sort?.direction ?? "asc" });
  }

  function handleSortDirection(direction: RowSortDirection) {
    if (!sort) return;
    onSortChange({ ...sort, direction });
  }

  function updateDraft(index: number, patch: Partial<RowFilterCondition>) {
    setDraft((current) =>
      current.map((condition, i) => (i === index ? { ...condition, ...patch } : condition)),
    );
  }

  function addCondition() {
    setDraft((current) => [
      ...current,
      { columnKey: firstColumnKey, operator: "contains", value: "" },
    ]);
  }

  function removeCondition(index: number) {
    setDraft((current) => current.filter((_, i) => i !== index));
  }

  function applyFilters() {
    // Drop incomplete conditions (value required but empty).
    const cleaned = draft.filter(
      (condition) =>
        condition.columnKey &&
        (!operatorNeedsValue(condition.operator) || condition.value.trim().length > 0),
    );
    onFiltersChange(cleaned);
    setFilterOpen(false);
  }

  function clearFilters() {
    setDraft([]);
    onFiltersChange([]);
    setFilterOpen(false);
  }

  return (
    <div className="border-b bg-background px-3 py-1.5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Sort */}
        <div className="flex items-center gap-1">
          <ArrowUpDownIcon className="size-3.5 text-muted-foreground" />
          <select
            aria-label="Sort by column"
            className={selectClass}
            value={sort?.columnKey ?? ""}
            onChange={(event) => handleSortColumn(event.target.value)}
          >
            <option value="">No sort</option>
            {columns.map((column) => (
              <option key={column.id} value={column.key}>
                {column.label}
              </option>
            ))}
          </select>
          {sort && (
            <select
              aria-label="Sort direction"
              className={selectClass}
              value={sort.direction}
              onChange={(event) => handleSortDirection(event.target.value as RowSortDirection)}
            >
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          )}
        </div>

        {/* Filter toggle */}
        <Button
          type="button"
          size="sm"
          variant={filters.length > 0 ? "default" : "outline"}
          className="h-7 gap-1 text-xs"
          onClick={() => setFilterOpen(!filterOpen)}
        >
          <FilterIcon className="size-3.5" />
          Filter{filters.length > 0 ? ` (${filters.length})` : ""}
        </Button>

        {(sort || filters.length > 0) && (
          <span className="text-muted-foreground">
            Showing {shown}
            {capped ? ` of ${total}` : total !== shown ? ` of ${total}` : ""}
            {capped ? " (view limited)" : ""}
            {loading ? " · loading…" : ""}
          </span>
        )}
      </div>

      {filterOpen && (
        <div className="mt-2 space-y-2 rounded-md border bg-muted/30 p-2">
          {draft.length === 0 ? (
            <p className="text-xs text-muted-foreground">No filters. Add one below.</p>
          ) : (
            draft.map((condition, index) => (
              <div key={index} className="flex flex-wrap items-center gap-1.5">
                <select
                  aria-label="Filter column"
                  className={selectClass}
                  value={condition.columnKey}
                  onChange={(event) => updateDraft(index, { columnKey: event.target.value })}
                >
                  {columns.map((column) => (
                    <option key={column.id} value={column.key}>
                      {column.label}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter condition"
                  className={selectClass}
                  value={condition.operator}
                  onChange={(event) =>
                    updateDraft(index, { operator: event.target.value as RowFilterOperator })
                  }
                >
                  {ROW_FILTER_OPERATORS.map((operator) => (
                    <option key={operator.value} value={operator.value}>
                      {operator.label}
                    </option>
                  ))}
                </select>
                {operatorNeedsValue(condition.operator) && (
                  <Input
                    aria-label="Filter value"
                    className="h-7 w-40 text-xs"
                    value={condition.value}
                    placeholder="value"
                    onChange={(event) => updateDraft(index, { value: event.target.value })}
                  />
                )}
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  className="size-7"
                  aria-label="Remove filter"
                  onClick={() => removeCondition(index)}
                >
                  <XIcon className="size-3.5" />
                </Button>
              </div>
            ))
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addCondition}>
              Add condition
            </Button>
            <div className="flex-1" />
            {filters.length > 0 && (
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={clearFilters}>
                Clear
              </Button>
            )}
            <Button type="button" size="sm" className="h-7 text-xs" onClick={applyFilters}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
