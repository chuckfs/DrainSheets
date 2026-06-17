"use client";

import { useMemo, useRef, useState } from "react";
import { SearchIcon } from "lucide-react";
import type { ProspectWithProperty } from "@/actions/prospects";
import type { PropertyProspectContact } from "@/actions/contacts";
import type { ProspectIndicatorCounts } from "@/lib/prospects/indicators";
import { PROSPECT_STATUSES } from "@/lib/validations/crm";
import { PropertyProspectsGrid } from "@/components/properties/property-prospects-grid";
import { GridToolbar } from "@/components/layout/grid-toolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { compactSelectClassName } from "@/hooks/use-list-search-params";

function matchesSearch(
  prospect: ProspectWithProperty,
  contact: PropertyProspectContact | undefined,
  query: string,
): boolean {
  const haystack = [
    prospect.company_name,
    prospect.website,
    prospect.comments,
    prospect.category,
    contact?.label,
    contact?.email,
    contact?.phone,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

export function PropertyProspectsGridWithToolbar({
  prospects,
  contactLabels,
  indicators,
  selectedProspectId,
  onSelectProspect,
  onOpenProspect,
  canAddProspect,
  propertyId,
}: {
  prospects: ProspectWithProperty[];
  contactLabels: PropertyProspectContact[];
  indicators: Map<string, ProspectIndicatorCounts>;
  selectedProspectId: string | null;
  onSelectProspect: (prospectId: string | null) => void;
  onOpenProspect: (prospectId: string) => void;
  canAddProspect: boolean;
  propertyId: string;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const contactByProspect = useMemo(
    () => new Map(contactLabels.map((contact) => [contact.prospect_id, contact])),
    [contactLabels],
  );

  const filteredProspects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return prospects.filter((prospect) => {
      if (statusFilter !== "all" && (prospect.status ?? "") !== statusFilter) {
        return false;
      }

      if (!query) return true;
      return matchesSearch(prospect, contactByProspect.get(prospect.id), query);
    });
  }, [prospects, search, statusFilter, contactByProspect]);

  const hasActiveFilters = search.trim().length > 0 || statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  return (
    <>
      <GridToolbar
        className="h-9 py-0"
        center={
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="relative w-full max-w-md">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={searchRef}
                    data-prospect-search="true"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search prospects..."
                    className="h-7 pl-8 text-xs"
                    aria-label="Search prospects"
                  />
                </div>
              }
            />
            <TooltipContent>Focus search (/)</TooltipContent>
          </Tooltip>
        }
        right={
          <>
            <select
              aria-label="Filter by status"
              value={statusFilter}
              className={compactSelectClassName}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All</option>
              {PROSPECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            {hasActiveFilters && (
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </>
        }
      />
      {filteredProspects.length === 0 && prospects.length > 0 ? (
        <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">No prospects match your search.</p>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <PropertyProspectsGrid
          prospects={filteredProspects}
          contactLabels={contactLabels}
          indicators={indicators}
          selectedProspectId={selectedProspectId}
          onSelectProspect={onSelectProspect}
          onOpenProspect={onOpenProspect}
          canAddProspect={canAddProspect}
          propertyId={propertyId}
        />
      )}
    </>
  );
}

export function focusProspectSearchFromToolbar() {
  const input = document.querySelector<HTMLInputElement>('[data-prospect-search="true"]');
  input?.focus();
}
