"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROSPECT_STATUSES } from "@/lib/validations/crm";

export function ProspectFilters({
  totalPages,
  currentPage,
}: {
  totalPages: number;
  currentPage: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          updateParams({
            q: String(formData.get("q") ?? ""),
            page: null,
          });
        }}
      >
        <div className="min-w-[200px] flex-1 space-y-2">
          <Label htmlFor="q">Search</Label>
          <Input
            id="q"
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Company, category..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            defaultValue={searchParams.get("status") ?? "all"}
            className="flex h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            onChange={(e) => updateParams({ status: e.target.value, page: null })}
          >
            <option value="all">All statuses</option>
            {PROSPECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort">Sort</Label>
          <select
            id="sort"
            defaultValue={searchParams.get("sort") ?? "company_name"}
            className="flex h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
            onChange={(e) => updateParams({ sort: e.target.value, page: null })}
          >
            <option value="company_name">Company</option>
            <option value="status">Status</option>
            <option value="created_at">Created</option>
          </select>
        </div>
        <Button type="submit">Search</Button>
      </form>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => updateParams({ page: String(currentPage - 1) })}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => updateParams({ page: String(currentPage + 1) })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
