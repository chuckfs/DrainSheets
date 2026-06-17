"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import type { ProspectWithProperty } from "@/actions/prospects";
import type { PropertyProspectContact } from "@/actions/contacts";
import type { ProspectIndicatorCounts } from "@/lib/prospects/indicators";
import {
  GRID_PIN,
  SmartsheetGridPinHead,
} from "@/components/data/grid-pinned-columns";
import {
  SmartsheetGrid,
  SmartsheetGridBody,
  SmartsheetGridEmpty,
  SmartsheetGridHeader,
  SmartsheetGridHead,
  SmartsheetGridRow,
} from "@/components/data/smartsheet-grid";
import { ProspectGridRow } from "@/components/properties/prospect-grid-row";

export type { PropertyProspectContact as ProspectContactLabel };

export function PropertyProspectsGrid({
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
  const [expandedCommentsId, setExpandedCommentsId] = useState<string | null>(null);
  const contactByProspect = new Map(contactLabels.map((contact) => [contact.prospect_id, contact]));

  const handleSelect = useCallback(
    (prospectId: string) => {
      onSelectProspect(selectedProspectId === prospectId ? null : prospectId);
    },
    [onSelectProspect, selectedProspectId],
  );

  if (prospects.length === 0) {
    return (
      <div className="p-3">
        <SmartsheetGridEmpty message="No prospects on this sheet yet." />
        {canAddProspect && (
          <div className="mt-2 text-center">
            <Link
              href={`/properties/${propertyId}/prospects/new`}
              className="text-sm text-link hover:underline"
            >
              Add the first prospect
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <SmartsheetGrid className="border-x-0">
      <SmartsheetGridHeader>
        <SmartsheetGridRow className="hover:bg-transparent even:bg-transparent">
          <SmartsheetGridPinHead pinLeft={GRID_PIN.rowNum} className="w-10 text-center">
            #
          </SmartsheetGridPinHead>
          <SmartsheetGridPinHead pinLeft={GRID_PIN.company} className="min-w-[160px]">
            Company
          </SmartsheetGridPinHead>
          <SmartsheetGridPinHead pinLeft={GRID_PIN.contact} className="min-w-[160px]">
            Contact
          </SmartsheetGridPinHead>
          <SmartsheetGridPinHead pinLeft={GRID_PIN.status} className="min-w-[88px]">
            Status
          </SmartsheetGridPinHead>
          <SmartsheetGridHead className="w-8 text-center" aria-label="Attachments">
            📎
          </SmartsheetGridHead>
          <SmartsheetGridHead className="w-8 text-center" aria-label="Notes">
            💬
          </SmartsheetGridHead>
          <SmartsheetGridHead className="hidden w-28 sm:table-cell">Use</SmartsheetGridHead>
          <SmartsheetGridHead className="hidden w-36 md:table-cell">Website</SmartsheetGridHead>
          <SmartsheetGridHead className="hidden min-w-[140px] xl:table-cell">Comments</SmartsheetGridHead>
        </SmartsheetGridRow>
      </SmartsheetGridHeader>
      <SmartsheetGridBody>
        {prospects.map((prospect, index) => (
          <ProspectGridRow
            key={prospect.id}
            prospect={prospect}
            index={index}
            contact={contactByProspect.get(prospect.id)}
            indicators={indicators.get(prospect.id)}
            isSelected={selectedProspectId === prospect.id}
            commentsExpanded={expandedCommentsId === prospect.id}
            onSelect={() => handleSelect(prospect.id)}
            onToggleComments={() =>
              setExpandedCommentsId((current) => (current === prospect.id ? null : prospect.id))
            }
            onOpenProspect={() => onOpenProspect(prospect.id)}
          />
        ))}
      </SmartsheetGridBody>
    </SmartsheetGrid>
  );
}
