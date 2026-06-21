"use client";

import type { ReactNode } from "react";
import { ChevronLeftIcon, ChevronRightIcon, LayoutGridIcon } from "lucide-react";
import { GridToolbar } from "@/components/layout/grid-toolbar";
import { useListSearchParams } from "@/hooks/use-list-search-params";
import { AppSelect } from "@/components/ui/app-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SortOption = {
  value: string;
  label: string;
};

type ListGridToolbarProps = {
  totalPages: number;
  currentPage: number;
  searchPlaceholder: string;
  searchAriaLabel: string;
  sortOptions: SortOption[];
  defaultSort: string;
  filters?: ReactNode;
  onSortChange?: (value: string) => void;
};

export function ListGridToolbar({
  totalPages,
  currentPage,
  searchPlaceholder,
  searchAriaLabel,
  sortOptions,
  defaultSort,
  filters,
  onSortChange,
}: ListGridToolbarProps) {
  const { searchParams, updateParams } = useListSearchParams();

  return (
    <GridToolbar
      left={
        <>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <LayoutGridIcon className="size-3.5" aria-hidden />
            Grid
          </span>
          {filters}
          <AppSelect
            id="sort"
            aria-label="Sort by"
            size="sm"
            triggerClassName="w-auto min-w-[7rem]"
            defaultValue={searchParams.get("sort") ?? defaultSort}
            options={sortOptions}
            onValueChange={(next) => {
              if (onSortChange) {
                onSortChange(next);
              } else {
                updateParams({ sort: next, page: null });
              }
            }}
          />
        </>
      }
      center={
        <form
          className="flex w-full max-w-md items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            updateParams({
              q: String(formData.get("q") ?? ""),
              page: null,
            });
          }}
        >
          <Input
            id="q"
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder={searchPlaceholder}
            className="h-7 text-xs"
            aria-label={searchAriaLabel}
          />
          <Button type="submit" size="sm" variant="outline" className="h-7 shrink-0 text-xs">
            Filter
          </Button>
        </form>
      }
      right={
        totalPages > 1 ? (
          <>
            <span className="text-xs text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={currentPage <= 1}
              aria-label="Previous page"
              onClick={() => updateParams({ page: String(currentPage - 1) })}
            >
              <ChevronLeftIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={currentPage >= totalPages}
              aria-label="Next page"
              onClick={() => updateParams({ page: String(currentPage + 1) })}
            >
              <ChevronRightIcon className="size-3.5" />
            </Button>
          </>
        ) : null
      }
    />
  );
}
