"use client";

import { ListGridToolbar } from "@/components/data/list-grid-toolbar";

export function DocumentsGridToolbar({
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
      searchPlaceholder="Search file name..."
      searchAriaLabel="Search documents"
      defaultSort="created_at"
      sortOptions={[
        { value: "file_name", label: "File name" },
        { value: "created_at", label: "Uploaded" },
        { value: "file_size", label: "File size" },
      ]}
    />
  );
}
