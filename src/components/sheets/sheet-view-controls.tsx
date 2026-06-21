"use client";

import { useEffect, useState } from "react";
import { ArrowUpDownIcon, XIcon } from "lucide-react";
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
import { AppSelect } from "@/components/ui/app-select";

function operatorNeedsValue(operator: RowFilterOperator): boolean {
  return ROW_FILTER_OPERATORS.find((entry) => entry.value === operator)?.needsValue ?? true;
}

export function SheetSortControls({
  columns,
  sort,
  onSortChange,
}: {
  columns: SheetColumn[];
  sort: RowSort | null;
  onSortChange: (sort: RowSort | null) => void;
}) {
  function handleSortColumn(columnKey: string) {
    if (!columnKey) {
      onSortChange(null);
      return;
    }
    onSortChange({ columnKey, direction: sort?.direction ?? "asc" });
  }

  function handleSortDirection(direction: RowSortDirection) {
    if (!sort) {
      return;
    }
    onSortChange({ ...sort, direction });
  }

  return (
    <div className="flex items-center gap-1">
      <ArrowUpDownIcon className="size-3.5 text-muted-foreground" aria-hidden />
      <AppSelect
        aria-label="Sort by column"
        size="sm"
        triggerClassName="w-auto min-w-[7rem]"
        placeholder="No sort"
        value={sort?.columnKey ?? ""}
        options={[
          { value: "", label: "No sort" },
          ...columns.map((column) => ({ value: column.key, label: column.label })),
        ]}
        onValueChange={handleSortColumn}
      />
      {sort ? (
        <AppSelect
          aria-label="Sort direction"
          size="sm"
          triggerClassName="w-auto"
          value={sort.direction}
          options={[
            { value: "asc", label: "A → Z" },
            { value: "desc", label: "Z → A" },
          ]}
          onValueChange={(direction) => handleSortDirection(direction as RowSortDirection)}
        />
      ) : null}
    </div>
  );
}

export function SheetViewStatus({
  sort,
  filters,
  shown,
  total,
  capped,
  loading,
}: {
  sort: RowSort | null;
  filters: RowFilterCondition[];
  shown: number;
  total: number;
  capped: boolean;
  loading: boolean;
}) {
  if (!sort && filters.length === 0) {
    return null;
  }

  return (
    <span className="text-xs text-muted-foreground">
      Showing {shown}
      {capped ? ` of ${total}` : total !== shown ? ` of ${total}` : ""}
      {capped ? " (view limited)" : ""}
      {loading ? " · loading…" : ""}
    </span>
  );
}

export function SheetFilterPanel({
  columns,
  filters,
  onFiltersChange,
  open,
  onOpenChange,
}: {
  columns: SheetColumn[];
  filters: RowFilterCondition[];
  onFiltersChange: (filters: RowFilterCondition[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState<RowFilterCondition[]>(filters);
  const firstColumnKey = columns[0]?.key ?? "";

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  if (!open) {
    return null;
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
    const cleaned = draft.filter(
      (condition) =>
        condition.columnKey &&
        (!operatorNeedsValue(condition.operator) || condition.value.trim().length > 0),
    );
    onFiltersChange(cleaned);
    onOpenChange(false);
  }

  function clearFilters() {
    setDraft([]);
    onFiltersChange([]);
    onOpenChange(false);
  }

  return (
    <div className="space-y-2 border-b bg-muted/20 px-3 py-2">
      {draft.length === 0 ? (
        <p className="text-xs text-muted-foreground">No filters. Add one below.</p>
      ) : (
        draft.map((condition, index) => (
          <div key={index} className="flex flex-wrap items-center gap-1.5">
            <AppSelect
              aria-label="Filter column"
              size="sm"
              triggerClassName="w-auto min-w-[7rem]"
              value={condition.columnKey}
              options={columns.map((column) => ({
                value: column.key,
                label: column.label,
              }))}
              onValueChange={(columnKey) => updateDraft(index, { columnKey })}
            />
            <AppSelect
              aria-label="Filter condition"
              size="sm"
              triggerClassName="w-auto min-w-[7rem]"
              value={condition.operator}
              options={ROW_FILTER_OPERATORS.map((operator) => ({
                value: operator.value,
                label: operator.label,
              }))}
              onValueChange={(operator) =>
                updateDraft(index, { operator: operator as RowFilterOperator })
              }
            />
            {operatorNeedsValue(condition.operator) ? (
              <Input
                aria-label="Filter value"
                className="h-7 w-40 text-xs"
                value={condition.value}
                placeholder="value"
                onChange={(event) => updateDraft(index, { value: event.target.value })}
              />
            ) : null}
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

      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={addCondition}>
          Add condition
        </Button>
        <div className="flex-1" />
        {filters.length > 0 ? (
          <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={clearFilters}>
            Clear
          </Button>
        ) : null}
        <Button type="button" size="sm" className="h-7 text-xs" onClick={applyFilters}>
          Apply
        </Button>
      </div>
    </div>
  );
}
