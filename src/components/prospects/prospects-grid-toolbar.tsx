"use client";

import { ListGridToolbar } from "@/components/data/list-grid-toolbar";
import { useListSearchParams, compactSelectClassName } from "@/hooks/use-list-search-params";
import { PROSPECT_STATUSES } from "@/lib/validations/crm";

export function ProspectsGridToolbar({
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
      searchPlaceholder="Search company, category..."
      searchAriaLabel="Search prospects"
      defaultSort="company_name"
      sortOptions={[
        { value: "company_name", label: "Company" },
        { value: "status", label: "Status" },
        { value: "created_at", label: "Last updated" },
      ]}
      filters={
        <select
          id="status"
          aria-label="Filter by status"
          defaultValue={searchParams.get("status") ?? "all"}
          className={compactSelectClassName}
          onChange={(e) => updateParams({ status: e.target.value, page: null })}
        >
          <option value="all">All statuses</option>
          {PROSPECT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      }
    />
  );
}
