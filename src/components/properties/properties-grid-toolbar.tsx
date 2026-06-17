"use client";

import { useEffect } from "react";
import { ListGridToolbar } from "@/components/data/list-grid-toolbar";
import { useListSearchParams, compactSelectClassName } from "@/hooks/use-list-search-params";
import {
  readStoredPropertySort,
  storePropertySort,
  type PropertySortValue,
} from "@/lib/property-sort";

export function PropertiesGridToolbar({
  totalPages,
  currentPage,
}: {
  totalPages: number;
  currentPage: number;
}) {
  const { searchParams, updateParams } = useListSearchParams();

  useEffect(() => {
    if (searchParams.get("sort")) return;
    const stored = readStoredPropertySort();
    if (stored) {
      updateParams({ sort: stored });
    }
    // Restore persisted sort once on mount when URL has no sort param.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSortChange(value: string) {
    const sort = value as PropertySortValue;
    storePropertySort(sort);
    updateParams({ sort, page: null });
  }

  return (
    <ListGridToolbar
      totalPages={totalPages}
      currentPage={currentPage}
      searchPlaceholder="Search name, city, address..."
      searchAriaLabel="Search properties"
      defaultSort="name"
      sortOptions={[
        { value: "name", label: "Name" },
        { value: "city", label: "City" },
        { value: "created_at", label: "Last updated" },
      ]}
      filters={
        <select
          id="status"
          aria-label="Filter by status"
          defaultValue={searchParams.get("status") ?? "active"}
          className={compactSelectClassName}
          onChange={(e) => updateParams({ status: e.target.value, page: null })}
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </select>
      }
      onSortChange={handleSortChange}
    />
  );
}
