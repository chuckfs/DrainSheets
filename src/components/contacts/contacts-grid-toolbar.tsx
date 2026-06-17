"use client";

import { ListGridToolbar } from "@/components/data/list-grid-toolbar";

export function ContactsGridToolbar({
  totalPages,
  currentPage,
}: {
  totalPages: number;
  currentPage: number;
}) {
  return (
    <ListGridToolbar
      totalPages={totalPages}
      currentPage={currentPage}
      searchPlaceholder="Search name, company, email..."
      searchAriaLabel="Search contacts"
      defaultSort="first_name"
      sortOptions={[
        { value: "first_name", label: "Name" },
        { value: "company", label: "Company" },
        { value: "created_at", label: "Last updated" },
      ]}
    />
  );
}
