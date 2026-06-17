"use client";

import { ListGridToolbar } from "@/components/data/list-grid-toolbar";
import { useListSearchParams, compactSelectClassName } from "@/hooks/use-list-search-params";

export function PropertiesGridToolbar({
  totalPages,
  currentPage,
}: {
  totalPages: number;
  currentPage: number;
}) {
  const { searchParams, updateParams } = useListSearchParams();

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
    />
  );
}
